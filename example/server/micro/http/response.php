<?php
namespace Micro\Http;

class Response {

    private $_headers;
    private $_content;

    public function __construct() {
        $this->_headers = array();
        $this->_content = '';
    }

    public function setContent($content) {
        $this->_content = $content;
    }

    public function responseJson($content) {
        $this->addHeader('Content-Type', 'application/json');
        $this->_content = json_encode($content, JSON_PRETTY_PRINT);
    }

    public function addHeader($header, $value) {
        if (is_null($value)) {
            $this->_headers[] = $header;
        } else {
            $this->_headers[] = "$header: $value";
        }
    }

    public function sendHeaders() {
        if ( ! headers_sent()) {
            foreach($this->_headers as $header) {
                header($header);
            }
        }
        $this->_headers = array();
    }

    public function send() {
        $this->sendHeaders();
        echo $this->_content;
    }

}