<?php

class Database {

    protected $_conn;

    protected $_host;
    protected $_user;
    protected $_pass;
    protected $_name;
    protected $_port;

    protected $_error;
    protected $_fields;
        
    public function __construct($host, $user, $pass, $name, $port = NULL) {
        $this->_conn = NULL;
        $this->_host = $host;
        $this->_user = $user;
        $this->_pass = $pass;
        $this->_name = $name;
        $this->_port = is_null($port) ? 3306 : $port;
        $this->_error = NULL;
        $this->_fields = array();
    }

    public function connect() {

        $this->disconnect();

        $this->_conn = new \Mysqli(
            $this->_host,
            $this->_user,
            $this->_pass,
            $this->_name,
            $this->_port
        );

        $this->_conn->set_charset('utf8');
    }

    public function disconnect() {
        if ($this->_conn) {
            $this->_conn->close();
            $this->_conn = NULL;
        }
    }

    public function isConnected() {
        return ! is_null($this->_conn);
    }

    public function validate() {
        if ( ! $this->_conn) {
            throw new Exception(_('Database not connected'));
        }
    }

    public function query($sql, $params = NULL) {
        
        $this->validate();

        $conn = $this->_conn;
        $stmt = $conn->stmt_init();
        $result = NULL;

        $sql = Text::compact($sql);

        if ($stmt->prepare($sql)) {
            if (is_array($params)) {
                $values = array();
                $types = '';

                foreach($params as $key => &$value) {
                    if ($value == 'null') {
                        $value = NULL;
                    }
                    
                    if (is_string($value)) {
                        $value = stripslashes($value);    
                    }

                    if (is_numeric($value)) {
                        $float  = floatval($value);
                        $types .= ($float && intval($float) != $float) ? 'd' : 'i';
                    } else {
                        $types .= 's';
                    }
                    
                    $values[$key] = &$params[$key];
                }

                $args = array_merge(array($types), $params);
                call_user_func_array(array($stmt, 'bind_param'), $args);
            }

            if ($stmt->execute()) {
                if (preg_match('/^(SELECT|SHOW)/i', $sql)) {
                    if (method_exists($stmt, 'get_result')) {
                        $result = $stmt->get_result();
                        $stmt->close();
                    } else {
                        $result = $stmt;
                        $result->store_result();
                    }
                    return new Result($this, $result);
                } else {
                    $stmt->close();
                    return TRUE;
                }
            } else {
                $stmt->close();
                throw new Exception($stmt->error);
            }
        } else {
            $stmt->close();
            throw new Exception($stmt->error);
        }
    }

    public function execute($sql, $params = NULL) {
        return $this->query($sql, $params);
    }

    public function fetchOne($sql, $params = NULL, $mode = Result::FETCH_ROW) {
        $result = $this->query($sql, $params);
        $result->setFetchMode($mode);
        
        return $result->getFirst();
    }

    public function fetchAll($sql, $params = NULL, $mode = Result::FETCH_ROW) {
        $result = $this->query($sql, $params);
        $result->setFetchMode($mode);

        return $result->toArray();
    }

    public function foundRows() {
        $result = $this->query("SELECT FOUND_ROWS() as total");
        $row = $result->getFirst();
        return (int) $row->total;
    }

    public function listField($table) {
        if ( ! isset($this->_fields[$table])) {

            $types = array(
                  1 => 'tinyint',
                  2 => 'smallint',
                  3 => 'int',
                  4 => 'float',
                  5 => 'double',
                  7 => 'timestamp',
                  8 => 'bigint',
                  9 => 'mediumint',
                 10 => 'date',
                 11 => 'time',
                 12 => 'datetime',
                 13 => 'year',
                 16 => 'bit',
                253 => 'varchar',
                254 => 'char',
                246 => 'decimal'
            );

            $query  = $this->_conn->query("SELECT * FROM $table LIMIT 1");
            $fields = array();

            if ($query) {
                $fields = $query->fetch_fields();
                foreach($fields as $field) {
                    if ($field->flags == MYSQLI_PRI_KEY_FLAG) {
                        $field->primary = TRUE;
                    } else {
                        $field->primary = FALSE;
                    }
                    $field->type = isset($types[$field->type]) ? $types[$field->type] : 'varchar';
                }
            }

            $this->_fields[$table] = $fields;
        }
        return $this->_fields[$table];
    }

    public function escape($value) {
        return $this->_conn->real_escape_string($value);
    }

    public function update($table, $data, $keys = NULL) {
        $fields = $this->listField($table);
        $update = array();
        $params = array();

        foreach($data as $key => $val) {
            foreach($fields as $field) {
                if ($key == $field->name) {
                    $update[] = "`{$key}` = ?";
                    $params[] = $val;
                }
            }
        }

        if (count($update) > 0) {
            $sql = "UPDATE `$table` SET ";
            $sql = $sql . implode(', ', $update);

            if (is_array($keys) && count($keys) > 0) {
                $sql = $sql . " WHERE ";
                $where = array();

                foreach($keys as $name => $val) {
                    $params[] = $val;
                    $where[] = "`{$name}` = ?";
                }

                $sql = $sql . implode(' AND ', $where);
            }    
            return $this->query($sql, $params);
        }
        return FALSE;
    }

    public function updateBatch($table, $values, $index) {
        if (empty($values)) {
            $this->_error(_('Bulk update: missing data'));
            return FALSE;
        }

        if (empty($index)) {
            $this->_error(_('Bulk update: missing index'));
            return FALSE;
        }

        // validate columns
        $types  = array();
        $sample = $values[0];

        foreach($this->listField($table) as $field) {
            foreach($sample as $key => $val) {
                if ($key == $field->name) {
                    $types[$key] = $field->type;
                }
            }
        }

        $keys = array();
        $when = array();

        foreach($values as $row) {
            switch(TRUE) {
                case strpos($types[$index], 'int') !== FALSE:
                    $keys[] = intval($row[$index]);
                    break;
                case $types[$index] == 'decimal':
                case $types[$index] == 'decimal':
                case $types[$index] == 'double':
                    $keys[] = floatval($row[$index]);
                    break;
                default:
                    $keys[] = "'" . $this->escape($row[$index]) . "'";
                    break;
            }

            foreach($row as $key => $val) {
                if ($key != $index && isset($types[$key])) {
                    if ( ! isset($when[$key])) {
                        $when[$key] = array();
                    }

                    if (is_null($val)) {
                        $val = 'NULL';
                    } else {
                        switch(TRUE) {
                            case strpos($types[$key], 'int') !== FALSE:
                                $val = intval($val);
                                break;
                            case $types[$index] == 'decimal':
                            case $types[$index] == 'decimal':
                            case $types[$index] == 'double':
                                $val = floatval($val);
                            default:
                                $val = "'" . $this->escape($val) . "'";
                                break;
                        }
                    }

                    $when[$key][] = "WHEN `$index` = '" . $this->escape($row[$index]) . "' THEN $val";
                }
            }
        }

        $case = array();

        foreach($when as $field => $rows) {
            $case[] = "`$field` = (CASE " . implode(" ", $rows) . " ELSE `$field` END)";
        }

        $sql .= "UPDATE `$table` SET " . implode(", ", $case) . " ";
        $sql .= "WHERE `$index` IN (" . implode(", ", $keys) . ")";
        
        return $this->query($sql);
    }

    public function insert($table, $data) {
        $fields = $this->listField($table);

        $params = array();
        $column = array();
        $values = array();

        foreach($data as $key => $val) {
            foreach($fields as $field) {
                if ($key == $field->name && ! $field->primary) {
                    $column[] = "`{$key}`";
                    $values[] = '?';
                    $params[] = $val;
                }
            }
        }

        if (count($column) > 0) {
            $sql = "INSERT INTO `$table` (" . implode(', ', $column) . ") VALUES (" . implode(', ', $values) . ")";
            return $this->query($sql, $params);
        }   

        return FALSE;
    }

    public function delete($table, $keys = NULL) {
        $sql = "DELETE FROM {$table}";

        $param = array();
        $where = array();

        if (is_array($keys)) {
            foreach($keys as $k => $v) {
                $where[] = "`{$k}` = ?";
                $param[] = $v;
            }
        }

        if (count($where) > 0) {
            $sql .= " WHERE (". implode(' AND ', $where) .")";
        }

        return $this->query($sql, $param);
    }
    

    public function insertId() {
        $this->validate();
        return $this->_conn->insert_id;
    }

    public function trans($action) {
        $this->validate();

        switch($action) {
            case 'start':
                $this->_conn->begin_transaction();
                break;
            case 'commit':
                $this->_conn->commit();
                break;
        }
    }

    public function getError() {
        return $this->_error;
    }

    protected function _error($message) {
        $this->_error = $message;
    }
}

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

    public function __construct(Database $db, $result, $fields = NULL) {
        $this->_db = $db;
        $this->_result = $result;
        $this->_pointer = 0;
        $this->_count = 0;
        $this->_row = NULL;
        $this->_mode = self::FETCH_ROW;

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

class Row {

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

}

class Text {

    public static function compact($str) {
        $str = trim($str);
        $str = preg_replace('/[\\x00-\\x20]/', ' ', $str);
        $str = preg_replace('/\s{2,}/', ' ', $str);
        return $str;
    }

}