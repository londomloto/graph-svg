<?php
namespace Micro\Http;

class Request {

    private $_input;
    private $_query;
    private $_param;

    public function __construct() {
        $this->_query = array();
        $this->_param = array();

        foreach($_GET as $key => $val) {
            $this->_query[$key] = $val;
        }

        $preferred = $this->getPreferredType();
        $method = $this->getMethod();
        
        if ($preferred == 'application/json') {
            $input = file_get_contents('php://input');

            if ( ! empty($input)) {
                try {
                    $decoded = json_decode($input, TRUE);
                    foreach($decoded as $key => $val) {
                        $_REQUEST[$key] = $val;
                        if ($method == 'GET') {
                            $_GET[$key] = $val;
                        } else if (in_array($method, array('POST', 'PUT', 'DELETE'))) {
                            $_POST[$key] = $val;
                        }
                    }    

                } catch(\Exception $e){}

                $this->_input = $input;
            } else {
                foreach($_POST as $key => $val) {
                    $_POST[$key] = json_decode($val, TRUE);
                }    
            }
        }
    }

    public function setParam($param) {
        $this->_param = $param;
    }

    public function setQuery($query) {
        $this->_query = $query;
    }

    public function setInput($input) {
        $this->_input = $input;
    }

    public function getMethod() {
        return $_SERVER['REQUEST_METHOD'];
    }

    public function getHeaders() {
        $headers = array();

        foreach($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $name = ucwords(strtolower(str_replace('_', ' ', substr($name, 5))));
                $name = str_replace(' ', '-', $name);
                $headers[$name] = $value;
            } else if($name == 'CONTENT_TYPE' || $name == 'CONTENT_LENGTH') {
                $name = ucwords(strtolower(str_replace('_', ' ', $name)));
                $name = str_replace(' ', '-', $name);
                $headers[$name] = $value;
            }
        }

        return $headers;
    }

    public function getHeader($header) {
        $header = strtoupper(strtr($header, '-', '_'));

        if (isset($_SERVER[$header])) {
            return $_SERVER[$header];
        }

        if (isset($_SERVER['HTTP_'.$header])) {
            return $_SERVER['HTTP_'.$header];
        }

        return '';
    }

    public function getAcceptedType($supported, $default = 'text/html') {
        $supp = array();

        foreach($supported as $type) {
            $supp[strtolower($type)] = $type;
        }

        if (empty($supp)) {
            return $default;
        }

        $httpAccept = isset($_SERVER['HTTP_X_ACCEPT']) 
            ? $_SERVER['HTTP_X_ACCEPT'] 
            : (isset($_SERVER['HTTP_ACCEPT'])
                ? $_SERVER['HTTP_ACCEPT'] 
                : FALSE);

        if ($httpAccept) {
            $accepts = $this->sortAccept($httpAccept);

            foreach($accepts as $type => $q) {
                if (substr($type, -2) != '/*') {
                    if (isset($supp[$type])) {
                        return $supp[$type];
                    }
                    continue;
                }

                if ($type == '*/*') {
                    return array_shift($supp);
                }

                list($general, $specific) = explode('/', $type);

                $general .= '/';
                $len = strlen($general);

                foreach ($supp as $mime => $t) {
                    if (strncasecmp($general, $mime, $len) == 0) {
                        return $t;
                    }
                }
            }
        }

        return $default;
    }

    public function getPreferredType() {
        $preferred = array(
            'text/html',
            'text/plain',
            'application/json',
            'application/xml',
            'application/xhtml+xml'
        );

        return $this->getAcceptedType($preferred);
    }

    public function sortAccept($header) {
        $matches = array(); 
        $parts = explode(',', $header);
        
        foreach($parts as $option) {
            $option = array_map('trim', explode(';', $option));
            $l = strtolower($option[0]);
            if (isset($option[1])) {
                $q = (float) str_replace('q=', '', $option[1]);
            } else {
                $q = null;
                if ($l == '*/*') {
                    $q = 0.01;
                } elseif (substr($l, -1) == '*') {
                    $q = 0.02;
                }
            }
            $matches[$l] = isset($q) ? $q : 1000 - count($matches);
        }

        arsort($matches, SORT_NUMERIC);
        return $matches;
    }

    public function getInput() {
        return $this->_input;
    }

    public function getPost($key = NULL) {
        if (is_null($key)) {
            return $_POST;
        }
        return isset($_POST[$key]) ? $_POST[$key] : NULL;
    }

    public function getQuery($key = NULL) {
        if (is_null($key)) {
            return $this->_query;
        }
        return isset($this->_query[$key]) ? $this->_query[$key] : NULL;
    }

    public function getParam($key = NULL) {
        if (is_null($key)) {
            return $this->_param;
        }
        return isset($this->_param[$key]) ? $this->_param[$key] : NULL;
    }

    public function hasFiles() {
        $files = $_FILES;
        $count = 0;

        if ( ! is_array($files)) {
            return 0;
        }

        foreach($files as $key => $file) {
            $error = $file['error'];
            
            if ( ! is_array($error)) {
                if ( ! $error) {
                    $count++;
                }
            }

            if (is_array($error)) {
                $count += $this->_hasFiles($error);
            }
        }

        return $count;
    }

    private function _hasFiles($data) {
        $count = 0;

        if ( ! is_array($data)) {
            return 1;
        }

        foreach($data as $value) {
            if ( ! is_array($value)) {
                if ( ! $value) {
                    $count++;
                }
            }

            if (is_array($value)) {
                $count += $this->_hasFiles($value);
            }
        }

        return $count;
    }

}