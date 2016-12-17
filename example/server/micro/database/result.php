<?php
namespace Micro\Database;

class Result implements \Iterator, \Countable {

    const FETCH_ROW = 0;
    const FETCH_ARRAY = 1;
    const FETCH_OBJECT = 2;

    protected $_db;
    protected $_result;
    protected $_pointer;
    protected $_row;
    protected $_mode;
    protected $_is_resource;
    protected $_is_stmt;
    protected $_fields;
    protected $_count;

    public function __construct(IDatabase $db, $result, $fields = NULL) {
        $this->_db = $db;
        $this->_result = $result;
        $this->_pointer = 0;
        $this->_count = 0;
        $this->_row = NULL;
        $this->_mode = self::FETCH_ARRAY;

        if ($result) {
            if ( ! is_array($result)) {
                $this->_is_resource = TRUE;
                $this->_is_stmt = get_class($result) == 'mysqli_stmt';

                if ($this->_is_stmt) {
                    $meta   = $result->result_metadata();
                    $fields = $meta->fetch_fields();
                } else {
                    $fields = $result->fetch_fields();    
                }

                $this->_count = $result->num_rows;
            } else {
                $this->_is_resource = FALSE;
                $this->_count = count($result);
            } 
        } else {
            $this->_result = array();
            $this->_is_resource = FALSE;
        }

        $this->_fields = $fields;
    }

    public function setFetchMode($mode) {
        $this->_mode = $mode;
    }

    public function fields() {
        return $this->_fields;
    }

    public function count() {
        return $this->_count;
    }

    public function valid() {
        return $this->_pointer < $this->_count;
    }

    public function current() {
        return $this->_row;
    }

    public function next() {
        $position = $this->_pointer + 1;
        $this->seek($position);
    }

    public function key() {
        return $this->_pointer;
    }

    public function seek($position) {
        if ($this->_pointer != $position || $this->_row == NULL) {
            $this->_pointer = $position;
            if ($this->_is_resource) {
                $this->_result->data_seek($this->_pointer);
                $this->_row = $this->_fetch();
            } else {
                $this->_row = isset($this->_result[$this->_pointer]) 
                    ? $this->_result[$this->_pointer] 
                    : FALSE;
            }
        }
    }

    public function rewind() {
        $this->seek(0);
    }

    public function getFirst() {
        if ($this->_count == 0) {
            return FALSE;
        }
        $this->seek(0);
        return $this->current();
    }

    public function getLast() {
        if ($this->_count == 0) {
            return FALSE;
        }
        $this->seek($this->_count - 1);
        return $this->current();
    }

    public function filter($predicate) {
        $filtered = array();
        
        foreach($this as $row) {
            $valid = $predicate($row);
            if (is_bool($valid)) {
                if ($valid === TRUE) {
                    $filtered[] = $row;    
                }
            } else {
                $filtered[] = $valid;
            }
        }

        $result = new self($this->_db, $filtered, $this->_fields);
        return $result;
    }

    public function toArray() {
        $rows = array();
        $mode = $this->_mode;
        
        foreach($this as $row) {
            $rows[] = $row;
        }

        return $rows;
    }

    public function __destruct() {
        if ($this->_is_resource) {
            if ($this->_is_stmt) {
                $this->_result->free_result();
            } else {
                $this->_result->free();        
            }
        } else {
            unset($this->_result);
        }
    }

    protected function _fetch() {
        if ($this->_is_stmt) {
            return $this->_fetchStmt();
        }

        $row = FALSE;

        switch($this->_mode) {
            case self::FETCH_ROW:
                $raw = $this->_result->fetch_assoc();
                $row = $raw ? new Row($raw) : FALSE;
                break;
            case self::FETCH_ARRAY:
                $raw = $this->_result->fetch_assoc();
                $row = $raw ? $raw : FALSE;
                break;
            case self::FETCH_OBJECT:
                $raw = $this->_result->fetch_object();
                $row = $raw ? $raw : FALSE;
                break;
        }

        return $row;
    }

    protected function _fetchStmt() {
        $fields = array_map(function($field){ return $field->name; }, $this->fields());
        $params = $fields;
        $length = count($params);

        for ($i = 0; $i < $length; $i++) {
            $params[$i] = &$params[$i];
        }
        
        call_user_func_array(array($this->_result, 'bind_result'), $params);
        
        $row = FALSE;

        if ($this->_result->fetch()) {
            $data = array();
            
            for ($i = 0; $i < $length; $i++) {
                $data[$fields[$i]] = $params[$i];
            }

            switch($this->_mode) {
                case self::FETCH_ROW:
                    $row = $data ? new Row($data) : FALSE;
                    break;
                case self::FETCH_ARRAY:
                    $row = $data ? $data : FALSE;
                    break;
                case self::FETCH_OBJECT:
                    $row = $data ? (object) $data : FALSE;
                    break;
            }
        }

        return $row;
    }
}