<?php
namespace Micro\Libs;

class Text {

    public static function compact($str) {
        $str = trim($str);
        $str = preg_replace('/[\\x00-\\x20]/', ' ', $str);
        $str = preg_replace('/\s{2,}/', ' ', $str);
        return $str;
    }

}