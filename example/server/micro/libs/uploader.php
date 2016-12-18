<?php
namespace Micro\Libs;

class Uploader {

    public $_path;

    public function __construct($config = array()) {
        $this->_path = '/tmp/';

        foreach($config as $key => $val) {
            $this->{'_'.$key} = $val;
        }
    }

    public function upload($key = 'userfile') {
        $file = $_FILES[$key];
        $exts = File::getExtension($file['tmp_name']);
        $name = sprintf('%s.%s', sha1($file['name'].date('YmdHis')), $exts);

        $path = preg_replace('/\/$/', '', $this->_path).'/';

        if (@move_uploaded_file($file['tmp_name'], $path.$name)) {
            return array(
                'name' => $name,
                'size' => filesize($path.$name)
            );
        }

        return FALSE;
    }

}