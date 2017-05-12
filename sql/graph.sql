/*
Navicat MySQL Data Transfer

Source Server         : mysql@local
Source Server Version : 50626
Source Host           : localhost:3306
Source Database       : graph

Target Server Type    : MYSQL
Target Server Version : 50626
File Encoding         : 65001

Date: 2016-12-20 00:12:09
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for diagrams
-- ----------------------------
DROP TABLE IF EXISTS `diagrams`;
CREATE TABLE `diagrams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) DEFAULT 'activity',
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `cover` varchar(255) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of diagrams
-- ----------------------------
INSERT INTO `diagrams` VALUES ('28', 'Graph.diagram.type.Activity', 'Activity Diagram', 'No diagram description', 'b307a53d0d2d795a91daf11aa100dc773b031015.jpg', '2016-12-19 02:07:29');
INSERT INTO `diagrams` VALUES ('32', 'Graph.diagram.type.Activity', 'Stacked Diagram', 'No diagram description', '8ef01ddee3b311b4a99e95e6414d2e2684536837.jpg', '2016-12-19 05:16:11');
INSERT INTO `diagrams` VALUES ('33', 'Graph.diagram.type.Activity', 'Registration Flow', 'No diagram description', 'b2d0ac426a1a0beff44322c7eb3f51a6ec4d7f29.jpg', '2016-12-19 05:34:12');
INSERT INTO `diagrams` VALUES ('34', 'Graph.diagram.type.Activity', 'Decision Flow', 'No diagram description', 'cd8e3c6531d8878b31b3ab66d2c5ced04c134568.jpg', '2016-12-19 05:49:06');
INSERT INTO `diagrams` VALUES ('37', 'Graph.diagram.type.Activity', 'Multi Phase', 'No diagram description', '85ba86aa0e412898ec17ca6069b08d12dc4fa904.jpg', '2016-12-19 16:37:58');
INSERT INTO `diagrams` VALUES ('39', 'Graph.diagram.type.Activity', 'Activity Diagram', 'No diagram description', 'c808f283845a6c2cf3a1f5796979173d58aac2b6.jpg', '2016-12-19 23:51:36');

-- ----------------------------
-- Table structure for links
-- ----------------------------
DROP TABLE IF EXISTS `links`;
CREATE TABLE `links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` varchar(50) DEFAULT NULL,
  `client_source` varchar(50) DEFAULT NULL,
  `client_target` varchar(50) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `router_type` varchar(255) DEFAULT NULL,
  `diagram_id` int(11) DEFAULT NULL,
  `source_id` int(11) DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `command` varchar(1000) DEFAULT NULL,
  `label` varchar(200) DEFAULT NULL,
  `label_distance` double(15,5) DEFAULT '0.50000',
  `convex` int(1) DEFAULT '1',
  `smooth` int(1) DEFAULT '1',
  `smoothness` int(11) DEFAULT NULL,
  `params` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=214 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of links
-- ----------------------------
INSERT INTO `links` VALUES ('96', 'graph-link-29', 'graph-shape-42', 'graph-shape-41', 'Graph.link.Orthogonal', 'orthogonal', '28', '138', '137', 'M282.69453865462975,155.50279722297637L282.69453865462975,194.14489748226708L490.13203610513415,194.14489748226708L490.13203610513415,126.14489748226701L547.6945386546297,126.14489748226681', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('97', 'graph-link-30', 'graph-shape-41', 'graph-shape-43', 'Graph.link.Orthogonal', 'orthogonal', '28', '137', '139', 'M617.6945386546297,155.50279722297626L617.6945386546297,235.44029885325745L430.8889473697866,235.44029885325745L430.8889473697866,271.50279722297626L352.69453865462975,271.50279722297574', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('98', 'graph-link-31', 'graph-shape-43', 'graph-shape-45', 'Graph.link.Orthogonal', 'orthogonal', '28', '139', '141', 'M268.01394736977517,301.50279722297626L268.0139473697754,373.1448988904174L547.6945386546297,373.14489889041783', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('99', 'graph-link-32', 'graph-shape-45', 'graph-shape-44', 'Graph.link.Orthogonal', 'orthogonal', '28', '141', '140', 'M613.5559707293403,398.50279722297563L613.5559707293357,502.4545152268099L282.69453865462975,502.4545152268099L282.6945386546303,454.5027972229766', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('105', 'graph-link-33', 'graph-shape-41', 'graph-shape-47', 'Graph.link.Orthogonal', 'orthogonal', '28', '137', '171', 'M687.6945386546297,125.50279722297641L1034.2788389893965,125.50279722297627L1034.2788389893965,299.9999999999998', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('107', 'graph-link-34', 'graph-shape-46', 'graph-shape-47', 'Graph.link.Orthogonal', 'orthogonal', '28', '169', '171', 'M792.4280895728643,209.50279722297694L792.4280895728627,274.50279722297626L881.6698887128887,274.50279722297626L881.6698887128878,299.50279722297665', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('109', 'graph-link-35', 'graph-shape-47', 'graph-shape-45', 'Graph.link.Orthogonal', 'orthogonal', '28', '171', '141', 'M921.5406925007683,314.50279722297665L921.5406925007683,368.50279722297626L687.6945386546297,368.50279722297637', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('116', 'graph-link-27', 'graph-shape-34', 'graph-shape-36', 'Graph.link.Orthogonal', 'orthogonal', '32', '179', '181', 'M325,114.00000000000132L419.0000000000007,114L419.0000000000013,307.9999999999998', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('117', 'graph-link-28', 'graph-shape-36', 'graph-shape-38', 'Graph.link.Orthogonal', 'orthogonal', '32', '181', '183', 'M489.00000000000006,338.0000000000006L611.0000000000058,338.0000000000017L611.000000000005,733.0000000000008', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('124', 'graph-link-6', 'graph-shape-13', 'graph-shape-15', 'Graph.link.Orthogonal', 'orthogonal', '33', '200', '202', 'M268.5886073376147,-55.45473101035168L404.79020265344747,-55.45473101035168L404.79020265344775,-12.000000000000227', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('125', 'graph-link-7', 'graph-shape-17', 'graph-shape-14', 'Graph.link.Orthogonal', 'orthogonal', '33', '204', '201', 'M953.0000000000001,17.545268989650253L1015.7902026534485,17.545268989649287L1015.7902026534485,-25.037965039470862', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('126', 'graph-link-8', 'graph-shape-15', 'graph-shape-19', 'Graph.link.Orthogonal', 'orthogonal', '33', '202', '206', 'M405,48.00000000000011L405,367.99999999999886', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('127', 'graph-link-9', 'graph-shape-19', 'graph-shape-20', 'Graph.link.Orthogonal', 'orthogonal', '33', '206', '207', 'M474.99999999999994,397.99999999999756L579,398.00000000000375', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('128', 'graph-link-10', 'graph-shape-20', 'graph-shape-16', 'Graph.link.Orthogonal', 'orthogonal', '33', '207', '203', 'M649,368.0000000000003L649,47.99999999999995', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('129', 'graph-link-11', 'graph-shape-16', 'graph-shape-17', 'Graph.link.Orthogonal', 'orthogonal', '33', '203', '204', 'M719.0000000000001,18.000000000002217L813.0000000000001,17.999999999999574', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('135', 'graph-link-9', 'graph-shape-31', 'graph-shape-29', 'Graph.link.Orthogonal', 'orthogonal', '34', '215', '213', 'M466.0000000000004,226.9999999999998L466.00000000000085,277.0000000000005', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('136', 'graph-link-10', 'graph-shape-29', 'graph-shape-31', 'Graph.link.Orthogonal', 'orthogonal', '34', '213', '215', 'M415.9999999999983,327.0000000000005L273.0000000000001,327L273.0000000000001,197L396,197.00000000000003', 'Tidak', '0.08681', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('137', 'graph-link-11', 'graph-shape-29', 'graph-shape-32', 'Graph.link.Orthogonal', 'orthogonal', '34', '213', '216', 'M466.0000000000022,376.9999999999996L465.9999999999978,451.99999999999903', 'Ya', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('138', 'graph-link-12', 'graph-shape-30', 'graph-shape-31', 'Graph.link.Orthogonal', 'orthogonal', '34', '214', '215', 'M466,125.99999999999994L465.99999999999994,167.00000000000003', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('139', 'graph-link-13', 'graph-shape-32', 'graph-shape-33', 'Graph.link.Orthogonal', 'orthogonal', '34', '216', '217', 'M466.0000000000017,512.0000000000003L465.99999999999613,580.0000000000018', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('189', 'graph-link-8', 'graph-shape-23', 'graph-shape-26', 'Graph.link.Orthogonal', 'orthogonal', '39', '307', '310', 'M548.9190658390112,251.51334691694677L386.04544635261817,251.51334691694666L386.045446352627,468.7639108102417', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('208', 'graph-link-60', 'graph-shape-117', 'graph-shape-118', 'Graph.link.Orthogonal', 'orthogonal', '37', '257', '258', 'M251.59570298818898,153.99999999999912L303,153.9999999999994', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('209', 'graph-link-61', 'graph-shape-118', 'graph-shape-120', 'Graph.link.Orthogonal', 'orthogonal', '37', '258', '260', 'M372.99999999999943,184L373.0000000000009,284.00000000000045', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('210', 'graph-link-62', 'graph-shape-120', 'graph-shape-121', 'Graph.link.Orthogonal', 'orthogonal', '37', '260', '322', 'M373.00000000000176,343.9999999999999L373.0000000000011,375.0000000000003', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('211', 'graph-link-63', 'graph-shape-121', 'graph-shape-124', 'Graph.link.Orthogonal', 'orthogonal', '37', '322', '273', 'M372.99999999999415,425.00000000000335L373.0000000000029,530.0000000000014', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('212', 'graph-link-64', 'graph-shape-121', 'graph-shape-123', 'Graph.link.Orthogonal', 'orthogonal', '37', '322', '262', 'M348.00000000000216,399.9999999999998L223.1241388768854,400L223.12413887688948,530.2034247693547', '', '0.50000', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');
INSERT INTO `links` VALUES ('213', 'graph-link-65', 'graph-shape-124', 'graph-shape-126', 'Graph.link.Orthogonal', 'orthogonal', '37', '273', '265', 'M443,559.999999999985L851.0000000000006,560L851.0000000000016,383.99999999999966', 'MESSAGE', '0.39943', '1', '0', '6', '[{\"key\":\"Data source\",\"value\":\"db.example\"}]');

-- ----------------------------
-- Table structure for shapes
-- ----------------------------
DROP TABLE IF EXISTS `shapes`;
CREATE TABLE `shapes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` varchar(50) DEFAULT NULL,
  `client_parent` varchar(50) DEFAULT NULL,
  `client_pool` varchar(50) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `mode` varchar(50) DEFAULT NULL,
  `diagram_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `width` double(15,0) DEFAULT NULL,
  `height` double(15,0) DEFAULT NULL,
  `left` double(15,0) DEFAULT NULL,
  `top` double(15,0) DEFAULT NULL,
  `label` varchar(100) DEFAULT NULL,
  `fill` varchar(30) DEFAULT NULL,
  `stroke` varchar(30) DEFAULT NULL,
  `stroke_width` int(11) DEFAULT NULL,
  `params` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=323 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of shapes
-- ----------------------------
INSERT INTO `shapes` VALUES ('136', 'graph-shape-40', null, 'pool-9', 'Graph.shape.activity.Lane', null, '28', null, '1040', '451', '139', '76', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('137', 'graph-shape-41', 'graph-shape-40', null, 'Graph.shape.activity.Action', null, '28', '136', '140', '60', '359', '20', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('138', 'graph-shape-42', 'graph-shape-40', null, 'Graph.shape.activity.Action', null, '28', '136', '140', '60', '24', '20', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('139', 'graph-shape-43', 'graph-shape-40', null, 'Graph.shape.activity.Action', null, '28', '136', '140', '60', '24', '166', 'A', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('140', 'graph-shape-44', 'graph-shape-40', null, 'Graph.shape.activity.Action', null, '28', '136', '140', '60', '24', '319', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('141', 'graph-shape-45', 'graph-shape-40', null, 'Graph.shape.activity.Action', null, '28', '136', '140', '60', '359', '263', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('169', 'graph-shape-46', 'graph-shape-40', null, 'Graph.shape.activity.Action', null, '28', '136', '140', '60', '526', '74', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('171', 'graph-shape-47', 'graph-shape-40', null, 'Graph.shape.activity.Join', null, '28', '136', '300', '15', '595', '224', '', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('178', 'graph-shape-33', null, 'pool-5', 'Graph.shape.activity.Lane', null, '32', null, '1000', '200', '75', '38', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('179', 'graph-shape-34', 'graph-shape-33', null, 'Graph.shape.activity.Action', null, '32', '178', '140', '60', '60', '46', 'A', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('180', 'graph-shape-35', null, 'pool-5', 'Graph.shape.activity.Lane', null, '32', null, '1000', '200', '75', '238', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('181', 'graph-shape-36', 'graph-shape-35', null, 'Graph.shape.activity.Action', null, '32', '180', '140', '60', '224', '70', 'B', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('182', 'graph-shape-37', null, 'pool-5', 'Graph.shape.activity.Lane', null, '32', null, '1000', '200', '75', '638', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('183', 'graph-shape-38', 'graph-shape-37', null, 'Graph.shape.activity.Action', null, '32', '182', '140', '60', '416', '95', 'C', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('185', 'graph-shape-39', null, 'pool-5', 'Graph.shape.activity.Lane', null, '32', null, '1000', '200', '75', '438', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('199', 'graph-shape-12', null, 'pool-5', 'Graph.shape.activity.Lane', null, '33', null, '1000', '200', '103', '-119', 'Visitor', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('200', 'graph-shape-13', 'graph-shape-12', null, 'Graph.shape.activity.Start', null, '33', '199', '60', '60', '56', '34', 'Start', 'rgb(255, 255, 255)', '#FF4081', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('201', 'graph-shape-14', 'graph-shape-12', null, 'Graph.shape.activity.Final', null, '33', '199', '60', '60', '833', '34', 'End', '#FF4081', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('202', 'graph-shape-15', 'graph-shape-12', null, 'Graph.shape.activity.Action', null, '33', '199', '140', '60', '182', '107', 'Daftar', '#FFFFFF', '#0CC2AA', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('203', 'graph-shape-16', 'graph-shape-12', null, 'Graph.shape.activity.Action', null, '33', '199', '140', '60', '426', '107', 'Terima Email', 'rgb(255, 255, 255)', '#FF4081', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('204', 'graph-shape-17', 'graph-shape-12', null, 'Graph.shape.activity.Action', null, '33', '199', '140', '60', '660', '107', 'Login', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('205', 'graph-shape-18', null, 'pool-5', 'Graph.shape.activity.Lane', null, '33', null, '1000', '200', '103', '281', 'Administrator', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('206', 'graph-shape-19', 'graph-shape-18', null, 'Graph.shape.activity.Action', null, '33', '205', '140', '60', '182', '87', 'Approval', 'rgb(255, 255, 255)', '#000000', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('207', 'graph-shape-20', 'graph-shape-18', null, 'Graph.shape.activity.Action', null, '33', '205', '140', '60', '426', '87', 'Kirim Email', '#FFFFFF', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('213', 'graph-shape-29', null, null, 'Graph.shape.activity.Router', null, '34', null, '100', '100', '416', '277', 'X > 5', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('214', 'graph-shape-30', null, null, 'Graph.shape.activity.Start', null, '34', null, '60', '60', '436', '66', 'Start', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('215', 'graph-shape-31', null, null, 'Graph.shape.activity.Action', null, '34', null, '140', '60', '396', '167', 'Input X', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('216', 'graph-shape-32', null, null, 'Graph.shape.activity.Action', null, '34', null, '140', '60', '396', '452', 'Tampilkan', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('217', 'graph-shape-33', null, null, 'Graph.shape.activity.Final', null, '34', null, '60', '60', '436', '580', 'End', '#FF4081', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('255', 'graph-shape-116', null, 'pool-40', 'Graph.shape.activity.Lane', null, '37', null, '377', '181', '124', '69', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('257', 'graph-shape-117', 'graph-shape-116', null, 'Graph.shape.activity.Start', null, '37', '255', '60', '60', '18', '55', 'Start', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('258', 'graph-shape-118', 'graph-shape-116', null, 'Graph.shape.activity.Action', null, '37', '255', '140', '60', '129', '55', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('259', 'graph-shape-119', null, 'pool-40', 'Graph.shape.activity.Lane', null, '37', null, '377', '215', '124', '250', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('260', 'graph-shape-120', 'graph-shape-119', null, 'Graph.shape.activity.Action', null, '37', '259', '140', '60', '129', '34', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('261', 'graph-shape-122', null, 'pool-40', 'Graph.shape.activity.Lane', null, '37', null, '377', '200', '124', '465', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('262', 'graph-shape-123', 'graph-shape-122', null, 'Graph.shape.activity.Final', null, '37', '261', '60', '60', '18', '65', 'End', '#FF4081', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('263', 'graph-shape-125', null, 'pool-43', 'Graph.shape.activity.Lane', null, '37', null, '402', '200', '643', '257', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('265', 'graph-shape-126', 'graph-shape-125', null, 'Graph.shape.activity.Action', null, '37', '263', '140', '60', '88', '67', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('273', 'graph-shape-124', 'graph-shape-122', null, 'Graph.shape.activity.Action', null, '37', '261', '140', '60', '129', '65', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('281', 'graph-shape-21', 'graph-shape-18', null, 'Graph.shape.activity.Action', null, '33', '205', '140', '60', '16', '87', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('282', 'graph-shape-22', null, 'pool-5', 'Graph.shape.activity.Lane', null, '33', null, '1000', '200', '103', '681', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('283', 'graph-shape-23', null, 'pool-5', 'Graph.shape.activity.Lane', null, '33', null, '1000', '200', '103', '81', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('284', 'graph-shape-25', 'graph-shape-23', null, 'Graph.shape.activity.Action', null, '33', '283', '140', '60', '16', '66', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('285', 'graph-shape-26', 'graph-shape-23', null, 'Graph.shape.activity.Router', null, '33', '283', '100', '100', '680', '46', 'Route', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('286', 'graph-shape-24', null, 'pool-5', 'Graph.shape.activity.Lane', null, '33', null, '1000', '200', '103', '481', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('287', 'graph-shape-27', 'graph-shape-24', null, 'Graph.shape.activity.Join', null, '33', '286', '300', '15', '129', '106', '', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('297', 'graph-shape-127', null, null, 'Graph.shape.common.Label', null, '37', null, null, null, '124', '37', 'PHASE 1', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('298', 'graph-shape-128', null, null, 'Graph.shape.common.Label', null, '37', null, null, null, '644', '221', 'PHASE 2', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('306', 'graph-shape-22', null, 'pool-10', 'Graph.shape.activity.Lane', null, '39', null, '1000', '248', '276', '140', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('307', 'graph-shape-23', 'graph-shape-22', null, 'Graph.shape.activity.Action', null, '39', '306', '140', '60', '223', '82', 'Action', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('308', 'graph-shape-24', null, 'pool-10', 'Graph.shape.activity.Lane', null, '39', null, '1000', '200', '276', '-60', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('309', 'graph-shape-25', null, 'pool-10', 'Graph.shape.activity.Lane', null, '39', null, '1000', '200', '276', '388', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('310', 'graph-shape-26', 'graph-shape-25', null, 'Graph.shape.activity.Router', null, '39', '309', '50', '50', '35', '81', 'Route', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('311', 'graph-shape-27', null, 'pool-10', 'Graph.shape.activity.Lane', null, '39', null, '1000', '200', '276', '-260', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('312', 'graph-shape-28', null, 'pool-10', 'Graph.shape.activity.Lane', null, '39', null, '1000', '200', '276', '588', 'Participant Role', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
INSERT INTO `shapes` VALUES ('322', 'graph-shape-121', 'graph-shape-119', null, 'Graph.shape.activity.Router', 'xor', '37', '259', '50', '50', '174', '125', 'Route', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)', '2', '[{\"key\":\"Source\",\"value\":\"db.employee\"}]');
