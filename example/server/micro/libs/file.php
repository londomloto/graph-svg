<?php
namespace Micro\Libs;

class File {

    public static function getExtension($file) {
        $exts = pathinfo($file, PATHINFO_EXTENSION);

        if (empty($exts) || $exts == 'tmp') {
            $mime = self::getType($file);

            $maps = array(
                'image/jpeg' => 'jpg',
                'image/png' => 'png'
            );

            $exts = isset($maps[$mime]) ? $maps[$mime] : $exts;
        }

        return $exts;
    }

    public static function getType($file) {
        $info = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $info->file($file);
        $info = NULL;

        return $mime;
    }
}