<?php
namespace Micro\Database;

class Row implements \JsonSerializable  {

    public function __construct($row = array()) {
        if (is_array($row)) {
            foreach($row as $field => $value) {
                $this->set($field, $value);
            }    
        }
    }

    public function set($field, $value) {
        $field = strval($field);
        $this->{$field} = $value;
    }

    public function toArray() {
        $array = array();
        $vars  = get_object_vars($this);

        foreach($vars as $key => $value) {
            if (is_object($value)) {
                if (method_exists($value, 'toArray')) {
                    $array[$key] = $value->toArray();
                } else {
                    $array[$key] = $value;
                }
            } else {
                $array[$key] = $value;
            }
        }

        return $array;
    }

    public function jsonSerialize() {
        return $this->toArray();
    }

}