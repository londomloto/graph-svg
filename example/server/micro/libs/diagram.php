<?php
namespace Micro\Libs;

use Micro\App;

class Diagram {

    public static function db() {
        return App::getDefault()->db();
    }

    /**
     * Parse raw data into diagram hierarchy
     */
    public static function parse($data) {
        if (is_string($data)) $data = json_decode($data, 1);
        if (is_null($data)) return FALSE;

        $diagram = array(
            'props' => array(),
            'links' => array(),
            'shapes' => array(),
        );

        $diagram['props'] = array_merge($diagram['props'], $data['props']);

        if (isset($data['shapes'], $data['links'])) {
            $diagram['shapes'] = self::nonRecursiveShapeTree($data['shapes']);
            $diagram['links'] = array_merge($data['links']);    
        }

        return $diagram;
    }

    public static function sortShapes(&$shapes) {
        usort($shapes, function($a, $b){
            return strcmp($a['props']['parent'], $b['props']['parent']);
        });

        return $shapes;
    }

    public static function recursiveShapeTree(&$shapes, $parentId = NULL) {
        $tree = array();

        foreach($shapes as &$shape) {
            $key = $shape['props']['guid'];
            $pid = $shape['props']['parent'];

            if ($pid == $parentId) {
                $children = self::recursiveShapeTree($shapes, $key);
                if ($children) {
                    $shape['children'] = $children;
                }
                $tree[$key] = $shape;
                unset($shape);
            }
        }

        $tree = self::rebuildShapeIndexes($tree);
        return $tree;
    }

    public static function nonRecursiveShapeTree($shapes) {
        $tree = array();

        if (empty($shapes)) {
            return array();
        }

        $offset = array_flip(
            array_map(
                function($shape){ 
                    return $shape['props']['guid']; 
                }, 
                $shapes
            )
        );

        foreach($shapes as $idx => &$shape) {
            $key = $shape['props']['guid'];
            $pid = $shape['props']['parent'];

            if (empty($pid)) {
                $tree[$idx] = &$shape;
            } else {
                if ( ! isset($shapes[$offset[$pid]]['children'])) {
                    $shapes[$offset[$pid]]['children'] = array();
                }
                $shapes[$offset[$pid]]['children'][$offset[$key]] = &$shape;
            }
        }

        $tree = self::rebuildShapeIndexes($tree);
        return $tree;
    }

    public static function rebuildShapeIndexes($tree) {
        $branch = array_values($tree);
        
        foreach($branch as &$node) {
            if (isset($node['children'])) {
                $node['children'] = self::rebuildShapeIndexes($node['children']);
            }
        }

        return $branch;
    }

    /**
     * Traverse down
     */
    public static function traverseShapes($tree, $callback) {
        foreach($tree as $node) {
            $callback($node);
            if (isset($node['children'])) {
                self::traverseShapes($node['children'], $callback);
            }
        }
    }

    public static function save($data) {
        if (isset($data['props']['id'])) {
            return self::update($data, $data['id']);
        } else {
            return self::create($data);
        }
    }

    public static function create($data) {
        $db = self::db();
        $data = self::parse($data);
        
        $result = array(
            'success' => FALSE,
            'data' => NULL
        );

        unset($data['props']['id']);

        $data['props']['created_date'] = date('Y-m-d H:i:s');
        $success = $db->insert('diagrams', $data['props']);

        if ($success) {
            $diagramId = $db->insertId();

            if (isset($data['shapes'])) {

                $shapes = array();
                
                self::traverseShapes(
                    $data['shapes'], 
                    function($item) use ($diagramId, &$shapes) {
                        
                        $success = self::_saveShape(array(
                            'type' => 'insert',
                            'data' => $item['props'],
                            'parent' => isset($shapes[$item['props']['parent']]) ? $shapes[$item['props']['parent']] : NULL,
                            'diagram_id' => $diagramId,
                            'params' => $item['params']
                        ));

                        if ($success) {
                            $shapes[$item['props']['guid']] = self::db()->insertId();
                        }
                    }
                );

                if (isset($data['links'])) {
                    foreach($data['links'] as $item) {
                        self::_saveLink(array(
                            'type' => 'insert',
                            'data' => $item['props'],
                            'params' => $item['params'],
                            'diagram_id' => $diagramId,
                            'source_id' => isset($shapes[$item['props']['source']]) ? $shapes[$item['props']['source']] : NULL,
                            'target_id' => isset($shapes[$item['props']['target']]) ? $shapes[$item['props']['target']] : NULL,
                        ));
                    }
                }
            }

            $result = self::export($diagramId);

        }

        return $result;
    }

    public static function update($data, $id) {
        $db = self::db();
        $data = self::parse($data);

        $result = array(
            'success' => FALSE,
            'data' => NULL
        );

        $success = $db->update('diagrams', $data['props'], array('id' => $id));

        if ($success) {

            if (isset($data['shapes']) && count($data['shapes']) > 0) {

                $exists = array();
                $shapes = array();

                self::traverseShapes($data['shapes'], function($item) use ($id, &$shapes, &$exists) {
                    if (empty($item['props']['id'])) {

                        $success = self::_saveShape(array(
                            'type' => 'insert',
                            'data' => $item['props'],
                            'parent' => isset($shapes[$item['props']['parent']]) ? $shapes[$item['props']['parent']] : NULL,
                            'diagram_id' => $id,
                            'params' => $item['params']
                        ));

                        if ($success) {
                            $shapes[$item['props']['guid']] = self::db()->insertId();
                            $exists[] = $shapes[$item['props']['guid']];
                        }
                    } else {
                        $success = self::_saveShape(array(
                            'type' => 'update',
                            'data' => $item['props'],
                            'keys' => array('id' => $item['props']['id']),
                            'params' => $item['params'],
                            'diagram_id' => $id,
                            'parent' => isset($shapes[$item['props']['parent']]) ? $shapes[$item['props']['parent']] : NULL,
                        ));

                        $exists[] = $item['props']['id'];
                        $shapes[$item['props']['guid']] = $item['props']['id'];
                    }
                    
                });

                if (count($exists) > 0) {
                    $sql  = 'DELETE FROM shapes WHERE diagram_id = ? ';
                    $sql .= 'AND id NOT IN(' . implode(', ', array_fill_keys($exists, '?')) . ')';
                    array_unshift($exists, $id);
                    $db->execute($sql, $exists);
                }

                if (isset($data['links']) && count($data['links']) > 0) {

                    $exists = array();

                    foreach($data['links'] as $item) {
                        if (empty($item['props']['id'])) {
                            $success = self::_saveLink(array(
                                'type' => 'insert',
                                'data' => $item['props'],
                                'params' => $item['params'],
                                'diagram_id' => $id,
                                'source_id' => isset($shapes[$item['props']['source']]) ? $shapes[$item['props']['source']] : NULL,
                                'target_id' => isset($shapes[$item['props']['target']]) ? $shapes[$item['props']['target']] : NULL,
                            ));

                            if ($success) {
                                $exists[] = $db->insertId();
                            }
                        } else {
                            self::_saveLink(array(
                                'type' => 'update',
                                'data' => $item['props'],
                                'keys' => array('id' => $item['props']['id']),
                                'params' => $item['params'],
                                'diagram_id' => $id,
                                'source_id' => isset($shapes[$item['props']['source']]) ? $shapes[$item['props']['source']] : NULL,
                                'target_id' => isset($shapes[$item['props']['target']]) ? $shapes[$item['props']['target']] : NULL,
                            ));

                            $exists[] = $item['props']['id'];
                        }
                    }

                    if (count($exists) > 0) {
                        $sql  = 'DELETE FROM links WHERE diagram_id = ? ';
                        $sql .= 'AND id NOT IN(' . implode(', ', array_fill_keys($exists, '?')) . ')';
                        array_unshift($exists, $id);
                        $db->execute($sql, $exists);
                    }

                } else {
                    $db->execute('DELETE FROM links WHERE diagram_id = ?', array($id));
                }

            } else {
                $db->execute('DELETE FROM shapes WHERE diagram_id = ?', array($id));
                $db->execute('DELETE FROM links WHERE diagram_id = ?', array($id));
            }

            $result = self::export($id);
        }

        return $result;
    }

    public static function delete($id) {
        $db = self::db();
        $ds = DIRECTORY_SEPARATOR;
        $app = App::getDefault();

        $result = array(
            'success' => FALSE
        );

        $bind = array($id);
        $diagram = $db->fetchOne('SELECT * FROM diagrams WHERE id = ?', $bind);
        
        if ($diagram) {
            if ( ! empty($diagram['cover'])) {
                @unlink($app->getRootPath().'uploads'.$ds.$diagram['cover']);
            }
            
            $db->execute('DELETE FROM links WHERE diagram_id = ?', $bind);
            $db->execute('DELETE FROM shapes WHERE diagram_id = ?', $bind);

            $success = $db->execute('DELETE FROM diagrams WHERE id = ?', $bind);

            $result['success'] = $success;
        }
        
        return $result;
    }

    private static function _saveShape($options) {
        $data = $options['data'];

        $payload = array(
            'type' => $data['type'],
            'mode' => $data['mode'],
            'client_id' => $data['guid'],
            'client_parent' => $data['parent'],
            'client_pool' => $data['pool'],
            'diagram_id' => $options['diagram_id'],
            'parent_id' => $options['parent'],
            'width' => $data['width'],
            'height' => $data['height'],
            'left' => $data['left'],
            'top' => $data['top'],
            'label' => $data['label'],
            'fill' => $data['fill'],
            'stroke' => $data['stroke'],
            'stroke_width' => $data['strokeWidth'],
            'params' => json_encode($options['params'])
        );

        if ($options['type'] == 'insert') {
            $args = array('shapes', $payload);
        } else {
            $args = array('shapes', $payload, $options['keys']);
        }

        return call_user_func_array(array(self::db(), $options['type']), $args);
    }

    private static function _getCoverUrl($diagram) {
        $ds = DIRECTORY_SEPARATOR;
        $app = App::getDefault();
        $cover = $app->getRootPath().'uploads'.$ds.$diagram['cover'];
        return $app->getBaseUrl().'uploads/'. ( file_exists($cover) && is_file($cover) ? $diagram['cover'] : 'cover.jpg');
    }

    private static function _saveLink($options) {
        $data = $options['data'];

        $payload = array(
            'type' => $data['type'],
            'client_id' => $data['guid'],
            'client_source' => $data['source'],
            'client_target' => $data['target'],
            'router_type' => $data['routerType'],
            'diagram_id' => $options['diagram_id'],
            'source_id' => $options['source_id'],
            'target_id' => $options['target_id'],
            'command' => $data['command'],
            'label' => $data['label'],
            'label_distance' => $data['labelDistance'],
            'convex' => (int)$data['convex'],
            'smooth' => (int)$data['smooth'],
            'smoothness' => (int)$data['smoothness'],
            'params' => json_encode($options['params'])
        );

        if ($options['type'] == 'insert') {
            $args = array('links', $payload);
        } else {
            $args = array('links', $payload, $options['keys']);
        }

        return call_user_func_array(array(self::db(), $options['type']), $args);
    }

    public static function find($id = NULL) {
        $id = (int) $id;
        return $id ? self::findById($id) : self::findAll();
    }

    public static function findAll() {
        $diagrams = self::db()->fetchAll('SELECT * FROM diagrams');

        foreach($diagrams as &$row) {
            $row['cover_url'] = self::_getCoverUrl($row);
        }

        return array(
            'success' => TRUE,
            'data' => $diagrams
        );
    }

    public static function findById($id) {
        return array(
            'success' => TRUE,
            'data' => self::db()->fetchOne('SELECT * FROM diagrams WHERE id = ?', array($id))
        );
    }

    public static function export($id) {
        $db = self::db();
        $ds = DIRECTORY_SEPARATOR;
        $app = App::getDefault();
        
        $result = array(
            'success' => FALSE,
            'data' => NULL
        );

        $diagram = $db->fetchOne('SELECT * FROM diagrams WHERE id = ?', array($id));

        if ($diagram) { 
            $diagram['cover_url'] = self::_getCoverUrl($diagram);

            $result['success'] = TRUE;

            $result['data'] = array(
                'props' => $diagram,
                'shapes' => array(),
                'links' => array()
            );

            $shapes = $db->fetchAll('SELECT * FROM shapes WHERE diagram_id = ?', array($id));

            foreach($shapes as $row) {
                $props = $row;
                $params = $row['params'];
                unset($props['params']);

                $result['data']['shapes'][] = array(
                    'props' => $props,
                    'params' => $params
                );
            }

            $links = $db->fetchAll('SELECT * FROM links WHERE diagram_id = ?', array($id));

            foreach($links as $row) {
                $props = $row;
                $params = $row['params'];
                unset($props['params']);

                $result['data']['links'][] = array(
                    'props' => $props,
                    'params' => $params
                );
            }
        }

        return $result;
    }
}