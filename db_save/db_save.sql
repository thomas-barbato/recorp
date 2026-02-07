-- --------------------------------------------------------
-- Hôte :                        127.0.0.1
-- Version du serveur:           5.7.19 - MySQL Community Server (GPL)
-- SE du serveur:                Win64
-- HeidiSQL Version:             9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Export de la structure de la base pour recorp_db
CREATE DATABASE IF NOT EXISTS `recorp_db` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `recorp_db`;

-- Export de la structure de la table recorp_db. auth_group
CREATE TABLE IF NOT EXISTS `auth_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.auth_group : ~0 rows (environ)
DELETE FROM `auth_group`;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. auth_group_permissions
CREATE TABLE IF NOT EXISTS `auth_group_permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.auth_group_permissions : ~0 rows (environ)
DELETE FROM `auth_group_permissions`;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. auth_permission
CREATE TABLE IF NOT EXISTS `auth_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=265 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.auth_permission : ~216 rows (environ)
DELETE FROM `auth_permission`;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
	(1, 'Can add log entry', 1, 'add_logentry'),
	(2, 'Can change log entry', 1, 'change_logentry'),
	(3, 'Can delete log entry', 1, 'delete_logentry'),
	(4, 'Can view log entry', 1, 'view_logentry'),
	(5, 'Can add permission', 2, 'add_permission'),
	(6, 'Can change permission', 2, 'change_permission'),
	(7, 'Can delete permission', 2, 'delete_permission'),
	(8, 'Can view permission', 2, 'view_permission'),
	(9, 'Can add group', 3, 'add_group'),
	(10, 'Can change group', 3, 'change_group'),
	(11, 'Can delete group', 3, 'delete_group'),
	(12, 'Can view group', 3, 'view_group'),
	(13, 'Can add user', 4, 'add_user'),
	(14, 'Can change user', 4, 'change_user'),
	(15, 'Can delete user', 4, 'delete_user'),
	(16, 'Can view user', 4, 'view_user'),
	(17, 'Can add content type', 5, 'add_contenttype'),
	(18, 'Can change content type', 5, 'change_contenttype'),
	(19, 'Can delete content type', 5, 'delete_contenttype'),
	(20, 'Can view content type', 5, 'view_contenttype'),
	(21, 'Can add session', 6, 'add_session'),
	(22, 'Can change session', 6, 'change_session'),
	(23, 'Can delete session', 6, 'delete_session'),
	(24, 'Can view session', 6, 'view_session'),
	(25, 'Can add archetype', 7, 'add_archetype'),
	(26, 'Can change archetype', 7, 'change_archetype'),
	(27, 'Can delete archetype', 7, 'delete_archetype'),
	(28, 'Can view archetype', 7, 'view_archetype'),
	(29, 'Can add asteroid', 8, 'add_asteroid'),
	(30, 'Can change asteroid', 8, 'change_asteroid'),
	(31, 'Can delete asteroid', 8, 'delete_asteroid'),
	(32, 'Can view asteroid', 8, 'view_asteroid'),
	(33, 'Can add cash shop', 9, 'add_cashshop'),
	(34, 'Can change cash shop', 9, 'change_cashshop'),
	(35, 'Can delete cash shop', 9, 'delete_cashshop'),
	(36, 'Can view cash shop', 9, 'view_cashshop'),
	(37, 'Can add faction', 10, 'add_faction'),
	(38, 'Can change faction', 10, 'change_faction'),
	(39, 'Can delete faction', 10, 'delete_faction'),
	(40, 'Can view faction', 10, 'view_faction'),
	(41, 'Can add log', 11, 'add_log'),
	(42, 'Can change log', 11, 'change_log'),
	(43, 'Can delete log', 11, 'delete_log'),
	(44, 'Can view log', 11, 'view_log'),
	(45, 'Can add module', 12, 'add_module'),
	(46, 'Can change module', 12, 'change_module'),
	(47, 'Can delete module', 12, 'delete_module'),
	(48, 'Can view module', 12, 'view_module'),
	(49, 'Can add npc', 13, 'add_npc'),
	(50, 'Can change npc', 13, 'change_npc'),
	(51, 'Can delete npc', 13, 'delete_npc'),
	(52, 'Can view npc', 13, 'view_npc'),
	(53, 'Can add npc template', 14, 'add_npctemplate'),
	(54, 'Can change npc template', 14, 'change_npctemplate'),
	(55, 'Can delete npc template', 14, 'delete_npctemplate'),
	(56, 'Can view npc template', 14, 'view_npctemplate'),
	(57, 'Can add planet', 15, 'add_planet'),
	(58, 'Can change planet', 15, 'change_planet'),
	(59, 'Can delete planet', 15, 'delete_planet'),
	(60, 'Can view planet', 15, 'view_planet'),
	(61, 'Can add player', 16, 'add_player'),
	(62, 'Can change player', 16, 'change_player'),
	(63, 'Can delete player', 16, 'delete_player'),
	(64, 'Can view player', 16, 'view_player'),
	(65, 'Can add player ship', 17, 'add_playership'),
	(66, 'Can change player ship', 17, 'change_playership'),
	(67, 'Can delete player ship', 17, 'delete_playership'),
	(68, 'Can view player ship', 17, 'view_playership'),
	(69, 'Can add resource', 18, 'add_resource'),
	(70, 'Can change resource', 18, 'change_resource'),
	(71, 'Can delete resource', 18, 'delete_resource'),
	(72, 'Can view resource', 18, 'view_resource'),
	(73, 'Can add sector', 19, 'add_sector'),
	(74, 'Can change sector', 19, 'change_sector'),
	(75, 'Can delete sector', 19, 'delete_sector'),
	(76, 'Can view sector', 19, 'view_sector'),
	(77, 'Can add security', 20, 'add_security'),
	(78, 'Can change security', 20, 'change_security'),
	(79, 'Can delete security', 20, 'delete_security'),
	(80, 'Can view security', 20, 'view_security'),
	(81, 'Can add ship category', 21, 'add_shipcategory'),
	(82, 'Can change ship category', 21, 'change_shipcategory'),
	(83, 'Can delete ship category', 21, 'delete_shipcategory'),
	(84, 'Can view ship category', 21, 'view_shipcategory'),
	(85, 'Can add skill', 22, 'add_skill'),
	(86, 'Can change skill', 22, 'change_skill'),
	(87, 'Can delete skill', 22, 'delete_skill'),
	(88, 'Can view skill', 22, 'view_skill'),
	(89, 'Can add station', 23, 'add_station'),
	(90, 'Can change station', 23, 'change_station'),
	(91, 'Can delete station', 23, 'delete_station'),
	(92, 'Can view station', 23, 'view_station'),
	(93, 'Can add user purchase', 24, 'add_userpurchase'),
	(94, 'Can change user purchase', 24, 'change_userpurchase'),
	(95, 'Can delete user purchase', 24, 'delete_userpurchase'),
	(96, 'Can view user purchase', 24, 'view_userpurchase'),
	(97, 'Can add warp', 25, 'add_warp'),
	(98, 'Can change warp', 25, 'change_warp'),
	(99, 'Can delete warp', 25, 'delete_warp'),
	(100, 'Can view warp', 25, 'view_warp'),
	(101, 'Can add warp zone', 26, 'add_warpzone'),
	(102, 'Can change warp zone', 26, 'change_warpzone'),
	(103, 'Can delete warp zone', 26, 'delete_warpzone'),
	(104, 'Can view warp zone', 26, 'view_warpzone'),
	(105, 'Can add station resource', 27, 'add_stationresource'),
	(106, 'Can change station resource', 27, 'change_stationresource'),
	(107, 'Can delete station resource', 27, 'delete_stationresource'),
	(108, 'Can view station resource', 27, 'view_stationresource'),
	(109, 'Can add skill effect', 28, 'add_skilleffect'),
	(110, 'Can change skill effect', 28, 'change_skilleffect'),
	(111, 'Can delete skill effect', 28, 'delete_skilleffect'),
	(112, 'Can view skill effect', 28, 'view_skilleffect'),
	(113, 'Can add ship', 29, 'add_ship'),
	(114, 'Can change ship', 29, 'change_ship'),
	(115, 'Can delete ship', 29, 'delete_ship'),
	(116, 'Can view ship', 29, 'view_ship'),
	(117, 'Can add sector warp zone', 30, 'add_sectorwarpzone'),
	(118, 'Can change sector warp zone', 30, 'change_sectorwarpzone'),
	(119, 'Can delete sector warp zone', 30, 'delete_sectorwarpzone'),
	(120, 'Can view sector warp zone', 30, 'view_sectorwarpzone'),
	(121, 'Can add research', 31, 'add_research'),
	(122, 'Can change research', 31, 'change_research'),
	(123, 'Can delete research', 31, 'delete_research'),
	(124, 'Can view research', 31, 'view_research'),
	(125, 'Can add recipe', 32, 'add_recipe'),
	(126, 'Can change recipe', 32, 'change_recipe'),
	(127, 'Can delete recipe', 32, 'delete_recipe'),
	(128, 'Can view recipe', 32, 'view_recipe'),
	(129, 'Can add player skill', 33, 'add_playerskill'),
	(130, 'Can change player skill', 33, 'change_playerskill'),
	(131, 'Can delete player skill', 33, 'delete_playerskill'),
	(132, 'Can view player skill', 33, 'view_playerskill'),
	(133, 'Can add player ship resource', 34, 'add_playershipresource'),
	(134, 'Can change player ship resource', 34, 'change_playershipresource'),
	(135, 'Can delete player ship resource', 34, 'delete_playershipresource'),
	(136, 'Can view player ship resource', 34, 'view_playershipresource'),
	(137, 'Can add player resource', 35, 'add_playerresource'),
	(138, 'Can change player resource', 35, 'change_playerresource'),
	(139, 'Can delete player resource', 35, 'delete_playerresource'),
	(140, 'Can view player resource', 35, 'view_playerresource'),
	(141, 'Can add player research', 36, 'add_playerresearch'),
	(142, 'Can change player research', 36, 'change_playerresearch'),
	(143, 'Can delete player research', 36, 'delete_playerresearch'),
	(144, 'Can view player research', 36, 'view_playerresearch'),
	(145, 'Can add player recipe', 37, 'add_playerrecipe'),
	(146, 'Can change player recipe', 37, 'change_playerrecipe'),
	(147, 'Can delete player recipe', 37, 'delete_playerrecipe'),
	(148, 'Can view player recipe', 37, 'view_playerrecipe'),
	(149, 'Can add player private message', 38, 'add_playerprivatemessage'),
	(150, 'Can change player private message', 38, 'change_playerprivatemessage'),
	(151, 'Can delete player private message', 38, 'delete_playerprivatemessage'),
	(152, 'Can view player private message', 38, 'view_playerprivatemessage'),
	(153, 'Can add player log', 39, 'add_playerlog'),
	(154, 'Can change player log', 39, 'change_playerlog'),
	(155, 'Can delete player log', 39, 'delete_playerlog'),
	(156, 'Can view player log', 39, 'view_playerlog'),
	(157, 'Can add planet resource', 40, 'add_planetresource'),
	(158, 'Can change planet resource', 40, 'change_planetresource'),
	(159, 'Can delete planet resource', 40, 'delete_planetresource'),
	(160, 'Can view planet resource', 40, 'view_planetresource'),
	(161, 'Can add npc template skill', 41, 'add_npctemplateskill'),
	(162, 'Can change npc template skill', 41, 'change_npctemplateskill'),
	(163, 'Can delete npc template skill', 41, 'delete_npctemplateskill'),
	(164, 'Can view npc template skill', 41, 'view_npctemplateskill'),
	(165, 'Can add npc template resource', 42, 'add_npctemplateresource'),
	(166, 'Can change npc template resource', 42, 'change_npctemplateresource'),
	(167, 'Can delete npc template resource', 42, 'delete_npctemplateresource'),
	(168, 'Can view npc template resource', 42, 'view_npctemplateresource'),
	(169, 'Can add npc resource', 43, 'add_npcresource'),
	(170, 'Can change npc resource', 43, 'change_npcresource'),
	(171, 'Can delete npc resource', 43, 'delete_npcresource'),
	(172, 'Can view npc resource', 43, 'view_npcresource'),
	(173, 'Can add faction resource', 44, 'add_factionresource'),
	(174, 'Can change faction resource', 44, 'change_factionresource'),
	(175, 'Can delete faction resource', 44, 'delete_factionresource'),
	(176, 'Can view faction resource', 44, 'view_factionresource'),
	(177, 'Can add faction rank', 45, 'add_factionrank'),
	(178, 'Can change faction rank', 45, 'change_factionrank'),
	(179, 'Can delete faction rank', 45, 'delete_factionrank'),
	(180, 'Can view faction rank', 45, 'view_factionrank'),
	(181, 'Can add faction leader', 46, 'add_factionleader'),
	(182, 'Can change faction leader', 46, 'change_factionleader'),
	(183, 'Can delete faction leader', 46, 'delete_factionleader'),
	(184, 'Can view faction leader', 46, 'view_factionleader'),
	(185, 'Can add asteroid resource', 47, 'add_asteroidresource'),
	(186, 'Can change asteroid resource', 47, 'change_asteroidresource'),
	(187, 'Can delete asteroid resource', 47, 'delete_asteroidresource'),
	(188, 'Can view asteroid resource', 47, 'view_asteroidresource'),
	(189, 'Can add logged in user', 48, 'add_loggedinuser'),
	(190, 'Can change logged in user', 48, 'change_loggedinuser'),
	(191, 'Can delete logged in user', 48, 'delete_loggedinuser'),
	(192, 'Can view logged in user', 48, 'view_loggedinuser'),
	(193, 'Can add archetype module', 49, 'add_archetypemodule'),
	(194, 'Can change archetype module', 49, 'change_archetypemodule'),
	(195, 'Can delete archetype module', 49, 'delete_archetypemodule'),
	(196, 'Can view archetype module', 49, 'view_archetypemodule'),
	(197, 'Can add player ship module', 50, 'add_playershipmodule'),
	(198, 'Can change player ship module', 50, 'change_playershipmodule'),
	(199, 'Can delete player ship module', 50, 'delete_playershipmodule'),
	(200, 'Can view player ship module', 50, 'view_playershipmodule'),
	(201, 'Can add ship module limitation', 51, 'add_shipmodulelimitation'),
	(202, 'Can change ship module limitation', 51, 'change_shipmodulelimitation'),
	(203, 'Can delete ship module limitation', 51, 'delete_shipmodulelimitation'),
	(204, 'Can view ship module limitation', 51, 'view_shipmodulelimitation'),
	(205, 'Can add skill experience', 52, 'add_skillexperience'),
	(206, 'Can change skill experience', 52, 'change_skillexperience'),
	(207, 'Can delete skill experience', 52, 'delete_skillexperience'),
	(208, 'Can view skill experience', 52, 'view_skillexperience'),
	(209, 'Can add private message', 53, 'add_privatemessage'),
	(210, 'Can change private message', 53, 'change_privatemessage'),
	(211, 'Can delete private message', 53, 'delete_privatemessage'),
	(212, 'Can view private message', 53, 'view_privatemessage'),
	(213, 'Can add message recipient', 54, 'add_messagerecipient'),
	(214, 'Can change message recipient', 54, 'change_messagerecipient'),
	(215, 'Can delete message recipient', 54, 'delete_messagerecipient'),
	(216, 'Can view message recipient', 54, 'view_messagerecipient'),
	(217, 'Can add private message recipients', 55, 'add_privatemessagerecipients'),
	(218, 'Can change private message recipients', 55, 'change_privatemessagerecipients'),
	(219, 'Can delete private message recipients', 55, 'delete_privatemessagerecipients'),
	(220, 'Can view private message recipients', 55, 'view_privatemessagerecipients'),
	(221, 'Can add group', 56, 'add_group'),
	(222, 'Can change group', 56, 'change_group'),
	(223, 'Can delete group', 56, 'delete_group'),
	(224, 'Can view group', 56, 'view_group'),
	(225, 'Can add group message', 57, 'add_groupmessage'),
	(226, 'Can change group message', 57, 'change_groupmessage'),
	(227, 'Can delete group message', 57, 'delete_groupmessage'),
	(228, 'Can view group message', 57, 'view_groupmessage'),
	(229, 'Can add message', 58, 'add_message'),
	(230, 'Can change message', 58, 'change_message'),
	(231, 'Can delete message', 58, 'delete_message'),
	(232, 'Can view message', 58, 'view_message'),
	(233, 'Can add sector message', 59, 'add_sectormessage'),
	(234, 'Can change sector message', 59, 'change_sectormessage'),
	(235, 'Can delete sector message', 59, 'delete_sectormessage'),
	(236, 'Can view sector message', 59, 'view_sectormessage'),
	(237, 'Can add faction message', 60, 'add_factionmessage'),
	(238, 'Can change faction message', 60, 'change_factionmessage'),
	(239, 'Can delete faction message', 60, 'delete_factionmessage'),
	(240, 'Can view faction message', 60, 'view_factionmessage'),
	(241, 'Can add player group', 61, 'add_playergroup'),
	(242, 'Can change player group', 61, 'change_playergroup'),
	(243, 'Can delete player group', 61, 'delete_playergroup'),
	(244, 'Can view player group', 61, 'view_playergroup'),
	(245, 'Can add message read status', 62, 'add_messagereadstatus'),
	(246, 'Can change message read status', 62, 'change_messagereadstatus'),
	(247, 'Can delete message read status', 62, 'delete_messagereadstatus'),
	(248, 'Can view message read status', 62, 'view_messagereadstatus'),
	(249, 'Can add combat effect', 63, 'add_combateffect'),
	(250, 'Can change combat effect', 63, 'change_combateffect'),
	(251, 'Can delete combat effect', 63, 'delete_combateffect'),
	(252, 'Can view combat effect', 63, 'view_combateffect'),
	(253, 'Can add scan intel', 64, 'add_scanintel'),
	(254, 'Can change scan intel', 64, 'change_scanintel'),
	(255, 'Can delete scan intel', 64, 'delete_scanintel'),
	(256, 'Can view scan intel', 64, 'view_scanintel'),
	(257, 'Can add scan effect', 65, 'add_scaneffect'),
	(258, 'Can change scan effect', 65, 'change_scaneffect'),
	(259, 'Can delete scan effect', 65, 'delete_scaneffect'),
	(260, 'Can view scan effect', 65, 'view_scaneffect'),
	(261, 'Can add scan intel group', 66, 'add_scanintelgroup'),
	(262, 'Can change scan intel group', 66, 'change_scanintelgroup'),
	(263, 'Can delete scan intel group', 66, 'delete_scanintelgroup'),
	(264, 'Can view scan intel group', 66, 'view_scanintelgroup');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. auth_user
CREATE TABLE IF NOT EXISTS `auth_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.auth_user : ~8 rows (environ)
DELETE FROM `auth_user`;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` (`id`, `password`, `last_login`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `date_joined`) VALUES
	(1, 'pbkdf2_sha256$600000$FifurFiDUXADSAKhXjCyM6$zNersFkSCnzwjdhsffHo8+LjkiWasDRUoFIHK6aTmyw=', '2026-01-18 09:59:25.057214', 0, 'test1', '', '', 'test1@email.com', 0, 1, '2020-03-20 10:38:15.000000'),
	(2, 'pbkdf2_sha256$600000$FifurFiDUXADSAKhXjCyM6$zNersFkSCnzwjdhsffHo8+LjkiWasDRUoFIHK6aTmyw=', '2026-01-13 15:17:57.901836', 0, 'test2', '', '', 'test3@email.com', 0, 1, '2020-03-20 10:38:15.000000'),
	(3, 'pbkdf2_sha256$600000$FifurFiDUXADSAKhXjCyM6$zNersFkSCnzwjdhsffHo8+LjkiWasDRUoFIHK6aTmyw=', '2026-01-18 10:07:22.198212', 0, 'test3', '', '', 'test4@email.com', 0, 1, '2020-03-20 10:38:15.000000'),
	(4, 'pbkdf2_sha256$600000$FifurFiDUXADSAKhXjCyM6$zNersFkSCnzwjdhsffHo8+LjkiWasDRUoFIHK6aTmyw=', '2025-12-11 09:15:51.632052', 0, 'test4', '', '', 'test4@email.com', 0, 1, '2020-03-20 10:38:15.000000'),
	(5, 'pbkdf2_sha256$600000$FifurFiDUXADSAKhXjCyM6$zNersFkSCnzwjdhsffHo8+LjkiWasDRUoFIHK6aTmyw=', '2025-11-24 13:01:24.124506', 0, 'test5', '', '', 'test5@email.com', 0, 1, '2020-03-20 10:38:15.000000'),
	(7, 'pbkdf2_sha256$600000$WpeF9K5VxsRvP2kNnjLpIG$TJuigz/vpRWx0XGVLTfPHDPaQ6xd1A1jrLH3quAQfyA=', '2026-01-21 13:58:13.209247', 0, 'belian', 'thomas', 'barbato', 'belian_maieslav@hotmail.fr', 0, 1, '2025-05-08 16:09:00.843467'),
	(34, 'pbkdf2_sha256$600000$Ksli7upIG0O1WGn09mVVpW$zjSOfrG4SFdsATWr6qI/FSiyoZ1mXa4S8zVcMa1CKKQ=', '2026-01-18 09:24:48.259218', 1, 'thomas404', '', '', '', 1, 1, '2025-05-22 13:38:39.403525'),
	(54, 'pbkdf2_sha256$600000$5V6vZx72sPd1wOtNdNOdJQ$V0L3vm6lUze7H8NLcnszaqJAiA2XZqqgUb86V7waL3I=', '2025-12-20 12:01:41.620596', 0, 'test199', 'none', 'none', 'test199@tt.com', 0, 1, '2025-12-15 08:30:00.239775'),
	(55, 'pbkdf2_sha256$600000$abTAaC0oO8BJVPSImBUOlE$9k9pJpWDyYmgVexwMbQrpmrZaQlejXMYgfYamhHbqQE=', '2026-01-18 09:58:12.679882', 0, 'test6', 'none', 'none', 'tt6.t@g.com', 0, 1, '2026-01-07 14:39:17.455227');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. auth_user_groups
CREATE TABLE IF NOT EXISTS `auth_user_groups` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.auth_user_groups : ~0 rows (environ)
DELETE FROM `auth_user_groups`;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. auth_user_user_permissions
CREATE TABLE IF NOT EXISTS `auth_user_user_permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.auth_user_user_permissions : ~0 rows (environ)
DELETE FROM `auth_user_user_permissions`;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_archetype
CREATE TABLE IF NOT EXISTS `core_archetype` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `data` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `ship_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `core_archetype_ship_id_9ef03e1c_fk_core_ship_id` (`ship_id`),
  CONSTRAINT `core_archetype_ship_id_9ef03e1c_fk_core_ship_id` FOREIGN KEY (`ship_id`) REFERENCES `core_ship` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_archetype : ~6 rows (environ)
DELETE FROM `core_archetype`;
/*!40000 ALTER TABLE `core_archetype` DISABLE KEYS */;
INSERT INTO `core_archetype` (`id`, `name`, `description`, `data`, `created_at`, `updated_at`, `ship_id`) VALUES
	(1, 'Soldier', 'Fighter specialising in piloting heavy spaceships', '{"Destroyer": 10, "Detection": 10, "Thermal Shield": 10, "Thermal Weapon": 10}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 5),
	(2, 'Harvester', 'Harvester specialising in gathering resources', '{"Mining": 10, "Frigate": 10, "Refining": 10, "Ballistic Shield": 10}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 2),
	(3, 'Engineer', 'Technician specialising in research and manufacturing', '{"Frigate": 10, "Crafting": 10, "Research": 10, "Counter Electronic Warfare": 10}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 3),
	(4, 'Spy', 'Fighter specialising in piloting light spaceships and electronic warfare', '{"Frigate": 10, "Hide Signature": 10, "Evasive Maneuver": 10, "Electronic Warfare": 10}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 8),
	(5, 'Technician', 'Technician specialising in keeping spaceship operational', '{"Frigate": 10, "Repaire": 10, "Shield Amelioration": 10, "Counter Electronic Warfare": 10}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 3),
	(6, 'Jack-of-all-trades', 'For those who like to explore, limited knowledge of piloting light spaceships and harvesting (more limited than those who become Harvester or Fighter)', '{"Mining": 10, "Frigate": 10, "Repaire": 10, "Ballistic Weapon": 10}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 1);
/*!40000 ALTER TABLE `core_archetype` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_archetypemodule
CREATE TABLE IF NOT EXISTS `core_archetypemodule` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `archetype_id` bigint(20) NOT NULL,
  `module_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_archetypemodule_archetype_id_eda23dab_fk_core_archetype_id` (`archetype_id`),
  KEY `core_archetypemodule_module_id_796de1fc_fk_core_module_id` (`module_id`),
  CONSTRAINT `core_archetypemodule_archetype_id_eda23dab_fk_core_archetype_id` FOREIGN KEY (`archetype_id`) REFERENCES `core_archetype` (`id`),
  CONSTRAINT `core_archetypemodule_module_id_796de1fc_fk_core_module_id` FOREIGN KEY (`module_id`) REFERENCES `core_module` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_archetypemodule : ~39 rows (environ)
DELETE FROM `core_archetypemodule`;
/*!40000 ALTER TABLE `core_archetypemodule` DISABLE KEYS */;
INSERT INTO `core_archetypemodule` (`id`, `created_at`, `updated_at`, `archetype_id`, `module_id`) VALUES
	(1, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 1, 9),
	(2, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 1, 23),
	(3, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 1, 37),
	(4, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 1, 101),
	(5, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 1, 30),
	(6, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 1, 78),
	(7, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 2, 2),
	(8, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 2, 50),
	(9, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 2, 93),
	(10, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 2, 30),
	(11, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 2, 24),
	(12, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 2, 36),
	(13, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 3, 2),
	(14, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 3, 64),
	(15, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 3, 30),
	(16, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 3, 23),
	(17, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 3, 36),
	(18, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 3, 58),
	(19, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 4, 2),
	(20, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 4, 23),
	(21, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 4, 36),
	(22, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 4, 31),
	(23, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 4, 92),
	(24, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 4, 78),
	(25, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 4, 108),
	(26, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 5, 2),
	(27, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 5, 23),
	(28, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 5, 36),
	(29, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 5, 30),
	(30, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 5, 43),
	(31, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 5, 50),
	(32, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 5, 95),
	(33, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 6, 10),
	(34, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 6, 23),
	(35, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 6, 37),
	(36, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 6, 30),
	(37, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 6, 92),
	(38, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 6, 44),
	(39, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000', 6, 56);
/*!40000 ALTER TABLE `core_archetypemodule` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_asteroid
CREATE TABLE IF NOT EXISTS `core_asteroid` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `data` json DEFAULT NULL,
  `size` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_asteroid : ~3 rows (environ)
DELETE FROM `core_asteroid`;
/*!40000 ALTER TABLE `core_asteroid` DISABLE KEYS */;
INSERT INTO `core_asteroid` (`id`, `name`, `data`, `size`, `created_at`, `updated_at`) VALUES
	(1, 'asteroid_1', '{"type": "asteroid", "animation": "asteroid_1"}', '{"x": 1, "y": 1}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(2, 'asteroid_2', '{"type": "asteroid", "animation": "asteroid_2"}', '{"x": 1, "y": 1}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(3, 'asteroid_3', '{"type": "asteroid", "animation": "asteroid_3"}', '{"x": 1, "y": 1}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000');
/*!40000 ALTER TABLE `core_asteroid` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_asteroidresource
CREATE TABLE IF NOT EXISTS `core_asteroidresource` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `quantity` int(10) unsigned NOT NULL,
  `data` json DEFAULT NULL,
  `coordinates` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `resource_id` bigint(20) DEFAULT NULL,
  `sector_id` bigint(20) NOT NULL,
  `source_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_asteroidresource_resource_id_0d74de43_fk_core_resource_id` (`resource_id`),
  KEY `core_asteroidresource_sector_id_5e48cfdf_fk_core_sector_id` (`sector_id`),
  KEY `core_asteroidresource_source_id_0b233c0f_fk_core_asteroid_id` (`source_id`),
  CONSTRAINT `core_asteroidresource_resource_id_0d74de43_fk_core_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `core_resource` (`id`),
  CONSTRAINT `core_asteroidresource_sector_id_5e48cfdf_fk_core_sector_id` FOREIGN KEY (`sector_id`) REFERENCES `core_sector` (`id`),
  CONSTRAINT `core_asteroidresource_source_id_0b233c0f_fk_core_asteroid_id` FOREIGN KEY (`source_id`) REFERENCES `core_asteroid` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=362 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_asteroidresource : ~44 rows (environ)
DELETE FROM `core_asteroidresource`;
/*!40000 ALTER TABLE `core_asteroidresource` DISABLE KEYS */;
INSERT INTO `core_asteroidresource` (`id`, `quantity`, `data`, `coordinates`, `created_at`, `updated_at`, `resource_id`, `sector_id`, `source_id`) VALUES
	(318, 0, '{"name": "a-1", "description": "qsdqsdq"}', '{"x": "12", "y": "26"}', '2026-01-08 15:23:57.652083', '2026-01-08 15:23:57.652083', 1, 3, 1),
	(319, 0, '{"name": "a-1", "description": "qsdqsdq"}', '{"x": "13", "y": "28"}', '2026-01-08 15:23:57.668083', '2026-01-08 15:23:57.668083', 1, 3, 1),
	(320, 0, '{"name": "a-1", "description": "qsdqsdq"}', '{"x": "12", "y": "30"}', '2026-01-08 15:23:57.685083', '2026-01-08 15:23:57.685083', 1, 3, 1),
	(321, 0, '{"name": "a-1", "description": "qsdqsdq"}', '{"x": "11", "y": "32"}', '2026-01-08 15:23:57.701670', '2026-01-08 15:23:57.702193', 1, 3, 1),
	(322, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "6", "y": "1"}', '2026-01-08 15:23:57.717747', '2026-01-08 15:23:57.717747', 1, 3, 3),
	(323, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "9", "y": "3"}', '2026-01-08 15:23:57.742747', '2026-01-08 15:23:57.742747', 1, 3, 3),
	(324, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "5", "y": "4"}', '2026-01-08 15:23:57.792240', '2026-01-08 15:23:57.792240', 1, 3, 3),
	(325, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "3", "y": "2"}', '2026-01-08 15:23:57.809241', '2026-01-08 15:23:57.809241', 1, 3, 3),
	(326, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "4", "y": "8"}', '2026-01-08 15:23:57.823574', '2026-01-08 15:23:57.823574', 1, 3, 3),
	(327, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "22", "y": "27"}', '2026-01-08 15:23:57.842477', '2026-01-08 15:23:57.842477', 1, 3, 3),
	(328, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "25", "y": "26"}', '2026-01-08 15:23:57.858476', '2026-01-08 15:23:57.858476', 1, 3, 3),
	(329, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "26", "y": "28"}', '2026-01-08 15:23:57.875476', '2026-01-08 15:23:57.875476', 1, 3, 3),
	(330, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "24", "y": "30"}', '2026-01-08 15:23:57.891327', '2026-01-08 15:23:57.892331', 1, 3, 3),
	(331, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "28", "y": "27"}', '2026-01-08 15:23:57.908865', '2026-01-08 15:23:57.908865', 1, 3, 3),
	(332, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "29", "y": "31"}', '2026-01-08 15:23:57.924865', '2026-01-08 15:23:57.924865', 1, 3, 3),
	(333, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "31", "y": "26"}', '2026-01-08 15:23:57.941867', '2026-01-08 15:23:57.941867', 1, 3, 3),
	(334, 0, '{"name": "a-2", "description": "qsdqsdq"}', '{"x": "32", "y": "28"}', '2026-01-08 15:23:57.957864', '2026-01-08 15:23:57.957864', 1, 3, 3),
	(335, 0, '{"name": "a2", "description": "aaa2"}', '{"x": "14", "y": "3"}', '2026-01-08 15:24:59.349961', '2026-01-08 15:24:59.349961', 1, 7, 2),
	(336, 0, '{"name": "a2", "description": "aaa2"}', '{"x": "16", "y": "3"}', '2026-01-08 15:24:59.399948', '2026-01-08 15:24:59.399948', 1, 7, 2),
	(337, 0, '{"name": "a2", "description": "aaa2"}', '{"x": "15", "y": "5"}', '2026-01-08 15:24:59.432833', '2026-01-08 15:24:59.432833', 1, 7, 2),
	(338, 0, '{"name": "a2", "description": "aaa2"}', '{"x": "11", "y": "7"}', '2026-01-08 15:24:59.448871', '2026-01-08 15:24:59.449872', 1, 7, 2),
	(339, 0, '{"name": "a2", "description": "aaa2"}', '{"x": "17", "y": "9"}', '2026-01-08 15:24:59.465571', '2026-01-08 15:24:59.465571', 1, 7, 2),
	(340, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "21", "y": "19"}', '2026-01-08 15:24:59.490700', '2026-01-08 15:24:59.490700', 1, 7, 3),
	(341, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "25", "y": "21"}', '2026-01-08 15:24:59.506727', '2026-01-08 15:24:59.506727', 1, 7, 3),
	(342, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "28", "y": "25"}', '2026-01-08 15:24:59.523579', '2026-01-08 15:24:59.523579', 1, 7, 3),
	(343, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "20", "y": "23"}', '2026-01-08 15:24:59.540396', '2026-01-08 15:24:59.540396', 1, 7, 3),
	(344, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "21", "y": "27"}', '2026-01-08 15:24:59.564962', '2026-01-08 15:24:59.564962', 1, 7, 3),
	(345, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "33", "y": "24"}', '2026-01-08 15:24:59.581947', '2026-01-08 15:24:59.581947', 1, 7, 3),
	(346, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "31", "y": "20"}', '2026-01-08 15:24:59.597948', '2026-01-08 15:24:59.598948', 1, 7, 3),
	(347, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "29", "y": "23"}', '2026-01-08 15:24:59.614998', '2026-01-08 15:24:59.614998', 1, 7, 3),
	(348, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "24", "y": "24"}', '2026-01-08 15:24:59.639163', '2026-01-08 15:24:59.639163', 1, 7, 3),
	(349, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "24", "y": "29"}', '2026-01-08 15:24:59.656580', '2026-01-08 15:24:59.656580', 1, 7, 3),
	(350, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "19", "y": "26"}', '2026-01-08 15:24:59.672971', '2026-01-08 15:24:59.672971', 1, 7, 3),
	(351, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "24", "y": "18"}', '2026-01-08 15:24:59.688813', '2026-01-08 15:24:59.688813', 1, 7, 3),
	(352, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "22", "y": "21"}', '2026-01-08 15:24:59.706124', '2026-01-08 15:24:59.706124', 1, 7, 3),
	(353, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "22", "y": "25"}', '2026-01-08 15:24:59.722529', '2026-01-08 15:24:59.722529', 1, 7, 3),
	(354, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "25", "y": "27"}', '2026-01-08 15:24:59.747310', '2026-01-08 15:24:59.747310', 1, 7, 3),
	(355, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "30", "y": "29"}', '2026-01-08 15:24:59.771761', '2026-01-08 15:24:59.771761', 1, 7, 3),
	(356, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "33", "y": "26"}', '2026-01-08 15:24:59.821884', '2026-01-08 15:24:59.821884', 1, 7, 3),
	(357, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "30", "y": "26"}', '2026-01-08 15:24:59.846579', '2026-01-08 15:24:59.846579', 1, 7, 3),
	(358, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "28", "y": "27"}', '2026-01-08 15:24:59.872096', '2026-01-08 15:24:59.872096', 1, 7, 3),
	(359, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "27", "y": "23"}', '2026-01-08 15:24:59.887771', '2026-01-08 15:24:59.887771', 1, 7, 3),
	(360, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "28", "y": "20"}', '2026-01-08 15:24:59.905211', '2026-01-08 15:24:59.905211', 1, 7, 3),
	(361, 0, '{"name": "a-3", "description": "a-3"}', '{"x": "35", "y": "20"}', '2026-01-08 15:24:59.921757', '2026-01-08 15:24:59.921757', 1, 7, 3);
/*!40000 ALTER TABLE `core_asteroidresource` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_cashshop
CREATE TABLE IF NOT EXISTS `core_cashshop` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_cashshop : ~0 rows (environ)
DELETE FROM `core_cashshop`;
/*!40000 ALTER TABLE `core_cashshop` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_cashshop` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_faction
CREATE TABLE IF NOT EXISTS `core_faction` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `data` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_faction : ~4 rows (environ)
DELETE FROM `core_faction`;
/*!40000 ALTER TABLE `core_faction` DISABLE KEYS */;
INSERT INTO `core_faction` (`id`, `name`, `data`, `created_at`, `updated_at`) VALUES
	(1, 'none', '{}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(2, 'culte technologie', '{"image": "placeholder.svg", "description": "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?"}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(3, 'Faction Democratique', '{"image": "placeholder.svg", "description": "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?"}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(4, 'Faction Indépendante', '{"image": "placeholder.svg", "description": "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?"}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000');
/*!40000 ALTER TABLE `core_faction` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_factionleader
CREATE TABLE IF NOT EXISTS `core_factionleader` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `faction_id` bigint(20) NOT NULL,
  `player_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_factionleader_faction_id_9c6340e4_fk_core_faction_id` (`faction_id`),
  KEY `core_factionleader_player_id_0316d67c_fk_core_player_id` (`player_id`),
  CONSTRAINT `core_factionleader_faction_id_9c6340e4_fk_core_faction_id` FOREIGN KEY (`faction_id`) REFERENCES `core_faction` (`id`),
  CONSTRAINT `core_factionleader_player_id_0316d67c_fk_core_player_id` FOREIGN KEY (`player_id`) REFERENCES `core_player` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_factionleader : ~0 rows (environ)
DELETE FROM `core_factionleader`;
/*!40000 ALTER TABLE `core_factionleader` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_factionleader` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_factionrank
CREATE TABLE IF NOT EXISTS `core_factionrank` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `responsibility_level` smallint(5) unsigned NOT NULL,
  `faction_xp_required` int(10) unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `faction_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_factionrank_faction_id_cbe525f4_fk_core_faction_id` (`faction_id`),
  CONSTRAINT `core_factionrank_faction_id_cbe525f4_fk_core_faction_id` FOREIGN KEY (`faction_id`) REFERENCES `core_faction` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_factionrank : ~0 rows (environ)
DELETE FROM `core_factionrank`;
/*!40000 ALTER TABLE `core_factionrank` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_factionrank` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_factionresource
CREATE TABLE IF NOT EXISTS `core_factionresource` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `quantity` int(10) unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `resource_id` bigint(20) DEFAULT NULL,
  `sector_id` bigint(20) NOT NULL,
  `source_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_factionresource_resource_id_5c3bf231_fk_core_resource_id` (`resource_id`),
  KEY `core_factionresource_sector_id_007a2bb2_fk_core_sector_id` (`sector_id`),
  KEY `core_factionresource_source_id_d9429945_fk_core_faction_id` (`source_id`),
  CONSTRAINT `core_factionresource_resource_id_5c3bf231_fk_core_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `core_resource` (`id`),
  CONSTRAINT `core_factionresource_sector_id_007a2bb2_fk_core_sector_id` FOREIGN KEY (`sector_id`) REFERENCES `core_sector` (`id`),
  CONSTRAINT `core_factionresource_source_id_d9429945_fk_core_faction_id` FOREIGN KEY (`source_id`) REFERENCES `core_faction` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_factionresource : ~0 rows (environ)
DELETE FROM `core_factionresource`;
/*!40000 ALTER TABLE `core_factionresource` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_factionresource` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_group
CREATE TABLE IF NOT EXISTS `core_group` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `creator_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_group_creator_id_43f1f29d_fk_core_player_id` (`creator_id`),
  CONSTRAINT `core_group_creator_id_43f1f29d_fk_core_player_id` FOREIGN KEY (`creator_id`) REFERENCES `core_player` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_group : ~0 rows (environ)
DELETE FROM `core_group`;
/*!40000 ALTER TABLE `core_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_group` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_log
CREATE TABLE IF NOT EXISTS `core_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `content` json DEFAULT NULL,
  `log_type` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_log : ~0 rows (environ)
DELETE FROM `core_log`;
/*!40000 ALTER TABLE `core_log` DISABLE KEYS */;
INSERT INTO `core_log` (`id`, `content`, `log_type`, `created_at`, `updated_at`) VALUES
	(3, '{"to": "sector_1", "from": "zone-transition", "event": "ZONE_CHANGE"}', 'ZONE_CHANGE', '2026-01-20 12:23:12.864125', '2026-01-20 12:23:12.864125'),
	(4, '{"to": "zone-transition", "from": "sector_1", "event": "ZONE_CHANGE"}', 'ZONE_CHANGE', '2026-01-20 12:56:24.882607', '2026-01-20 12:56:24.883137'),
	(5, '{"event": "SCAN", "author": "Case", "target": "soldat3"}', 'SCAN', '2026-01-20 13:20:03.040855', '2026-01-20 13:20:03.041857'),
	(6, '{"event": "SCAN", "author": "Case", "target": "soldat3"}', 'SCAN', '2026-01-20 13:35:51.014363', '2026-01-20 13:35:51.015365'),
	(7, '{"event": "SCAN", "author": "Case", "target": "Deirdre"}', 'SCAN', '2026-01-20 13:36:20.119830', '2026-01-20 13:36:20.119906'),
	(8, '{"event": "SCAN", "author": "Case", "target": "soldat3"}', 'SCAN', '2026-01-20 13:49:00.007360', '2026-01-20 13:49:00.008360'),
	(9, '{"event": "SCAN", "author": "Case", "target": "soldat3"}', 'SCAN', '2026-01-20 13:52:24.964034', '2026-01-20 13:52:24.964034'),
	(10, '{"event": "SCAN", "author": "Case", "target": "Murthy"}', 'SCAN', '2026-01-20 13:54:27.051566', '2026-01-20 13:54:27.052565'),
	(11, '{"event": "SCAN", "author": "Case", "target": "Light Raider"}', 'SCAN', '2026-01-20 13:56:13.472975', '2026-01-20 13:56:13.473974'),
	(12, '{"event": "SCAN", "author": "Case", "target": "Murthy"}', 'SCAN', '2026-01-20 13:57:16.112446', '2026-01-20 13:57:16.112446'),
	(13, '{"event": "SCAN", "author": "Case", "target": "Murthy"}', 'SCAN', '2026-01-20 14:11:14.282126', '2026-01-20 14:11:14.282126'),
	(14, '{"event": "SCAN", "author": "Case", "target": "Murthy"}', 'SCAN', '2026-01-20 14:13:03.952374', '2026-01-20 14:13:03.953374'),
	(15, '{"event": "SCAN", "author": "Case", "target": "recolteur"}', 'SCAN', '2026-01-20 14:13:17.305149', '2026-01-20 14:13:17.306149'),
	(16, '{"event": "SCAN", "author": "Case", "target": "Murthy"}', 'SCAN', '2026-01-20 14:14:18.687436', '2026-01-20 14:14:18.688439'),
	(17, '{"event": "SCAN", "author": "Case", "target": "recolteur"}', 'SCAN', '2026-01-20 14:14:39.004176', '2026-01-20 14:14:39.004176'),
	(18, '{"event": "SCAN", "author": "Case", "target": "soldat3"}', 'SCAN', '2026-01-20 14:18:15.430614', '2026-01-20 14:18:15.430614'),
	(19, '{"event": "SCAN", "author": "Case", "target": "soldat3"}', 'SCAN', '2026-01-20 14:19:20.807115', '2026-01-20 14:19:20.807115'),
	(20, '{"event": "SCAN", "author": "Case", "target": "Murthy"}', 'SCAN', '2026-01-20 14:21:36.911525', '2026-01-20 14:21:36.911525'),
	(21, '{"event": "SCAN", "author": "Case", "target": "Murthy"}', 'SCAN', '2026-01-20 14:44:34.820672', '2026-01-20 14:44:34.820672'),
	(22, '{"event": "SCAN", "author": "Case", "target": "Deirdre"}', 'SCAN', '2026-01-20 14:47:57.376188', '2026-01-20 14:47:57.377187'),
	(23, '{"event": "SCAN", "author": "Case", "target": "Billy"}', 'SCAN', '2026-01-20 14:48:02.388065', '2026-01-20 14:48:02.388065'),
	(24, '{"to": "sector_1", "from": "zone-transition", "event": "ZONE_CHANGE"}', 'ZONE_CHANGE', '2026-01-20 14:48:15.389587', '2026-01-20 14:48:15.389587'),
	(25, '{"to": "zone-transition", "from": "sector_1", "event": "ZONE_CHANGE"}', 'ZONE_CHANGE', '2026-01-20 14:49:05.683378', '2026-01-20 14:49:05.684377'),
	(26, '{"to": "sector_1", "from": "zone-transition", "event": "ZONE_CHANGE"}', 'ZONE_CHANGE', '2026-01-21 12:03:11.219251', '2026-01-21 12:03:11.219251'),
	(27, '{"to": "zone-transition", "from": "sector_1", "event": "ZONE_CHANGE"}', 'ZONE_CHANGE', '2026-01-21 12:03:25.070233', '2026-01-21 12:03:25.070233'),
	(28, '{"event": "SCAN", "author": "Case", "target": "Billy"}', 'SCAN', '2026-01-21 13:37:04.686276', '2026-01-21 13:37:04.686276'),
	(29, '{"to": "zone-transition", "from": "tuto_sector", "event": "ZONE_CHANGE"}', 'ZONE_CHANGE', '2026-01-21 13:58:34.510495', '2026-01-21 13:58:34.510495'),
	(30, '{"event": "SCAN", "author": "Case", "target": "Belian"}', 'SCAN', '2026-01-21 13:59:00.600127', '2026-01-21 13:59:00.600127'),
	(31, '{"event": "SCAN", "author": "Case", "target": "Light Raider"}', 'SCAN', '2026-01-21 14:52:45.492661', '2026-01-21 14:52:45.493661'),
	(32, '{"event": "SCAN", "author": "Case", "target": "Light Raider"}', 'SCAN', '2026-01-21 14:53:04.732249', '2026-01-21 14:53:04.733250'),
	(33, '{"event": "SCAN", "author": "Case", "target": "Light Raider"}', 'SCAN', '2026-01-21 14:53:23.457297', '2026-01-21 14:53:23.457297');
/*!40000 ALTER TABLE `core_log` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_loggedinuser
CREATE TABLE IF NOT EXISTS `core_loggedinuser` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `session_key` varchar(32) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `core_loggedinuser_user_id_5262dd0b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=337 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_loggedinuser : ~3 rows (environ)
DELETE FROM `core_loggedinuser`;
/*!40000 ALTER TABLE `core_loggedinuser` DISABLE KEYS */;
INSERT INTO `core_loggedinuser` (`id`, `session_key`, `user_id`) VALUES
	(306, '1tiyhmr076lta2wyccr53ztahovea9k2', 54),
	(331, 'vb6w7xxnqel265pzxlrcrd66ui9aa1oi', 2),
	(335, '6buqd45qc4c24t00xurskew7eahoxumy', 3),
	(336, 'gpbvyblp8e9h1aqynu3cerxdk9z3vv46', 7);
/*!40000 ALTER TABLE `core_loggedinuser` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_message
CREATE TABLE IF NOT EXISTS `core_message` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `content` longtext NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `author_id` bigint(20) NOT NULL,
  `channel` varchar(10) NOT NULL,
  `faction_id` bigint(20) DEFAULT NULL,
  `group_id` bigint(20) DEFAULT NULL,
  `sector_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `core_message_author_id_e56399bc_fk_core_player_id` (`author_id`),
  KEY `core_message_faction_id_359df9b5_fk_core_faction_id` (`faction_id`),
  KEY `core_message_group_id_bafa3b34_fk_core_group_id` (`group_id`),
  KEY `core_message_sector_id_d7b4553d_fk_core_sector_id` (`sector_id`),
  KEY `core_messag_channel_3826ee_idx` (`channel`,`sector_id`,`created_at`),
  KEY `core_messag_channel_9d7672_idx` (`channel`,`faction_id`,`created_at`),
  KEY `core_messag_channel_768781_idx` (`channel`,`group_id`,`created_at`),
  CONSTRAINT `core_message_author_id_e56399bc_fk_core_player_id` FOREIGN KEY (`author_id`) REFERENCES `core_player` (`id`),
  CONSTRAINT `core_message_faction_id_359df9b5_fk_core_faction_id` FOREIGN KEY (`faction_id`) REFERENCES `core_faction` (`id`),
  CONSTRAINT `core_message_group_id_bafa3b34_fk_core_group_id` FOREIGN KEY (`group_id`) REFERENCES `core_group` (`id`),
  CONSTRAINT `core_message_sector_id_d7b4553d_fk_core_sector_id` FOREIGN KEY (`sector_id`) REFERENCES `core_sector` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=204 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_message : ~44 rows (environ)
DELETE FROM `core_message`;
/*!40000 ALTER TABLE `core_message` DISABLE KEYS */;
INSERT INTO `core_message` (`id`, `content`, `created_at`, `author_id`, `channel`, `faction_id`, `group_id`, `sector_id`) VALUES
	(152, 'test', '2025-11-17 14:20:10.869649', 24, 'SECTOR', NULL, NULL, 3),
	(153, 'TEST', '2025-11-17 14:21:55.184696', 24, 'SECTOR', NULL, NULL, 3),
	(154, 'test', '2025-11-17 14:24:01.182980', 24, 'SECTOR', NULL, NULL, 3),
	(155, 'qsqsdqsd', '2025-11-17 14:27:43.308055', 24, 'SECTOR', NULL, NULL, 3),
	(156, 'test', '2025-11-17 14:42:07.590277', 23, 'SECTOR', NULL, NULL, 3),
	(157, 'test1', '2025-11-17 14:42:24.207339', 24, 'SECTOR', NULL, NULL, 3),
	(158, 'test2', '2025-11-17 14:42:25.740671', 24, 'SECTOR', NULL, NULL, 3),
	(159, 'test3', '2025-11-17 14:42:27.452303', 24, 'SECTOR', NULL, NULL, 3),
	(160, 'fact1', '2025-11-17 14:42:30.893833', 24, 'FACTION', 2, NULL, NULL),
	(161, 'un message', '2025-11-17 14:45:14.550827', 24, 'SECTOR', NULL, NULL, 3),
	(162, 'j\'en envois un autre', '2025-11-17 14:45:18.649160', 24, 'SECTOR', NULL, NULL, 3),
	(163, 'test', '2025-11-17 14:45:34.807150', 24, 'SECTOR', NULL, NULL, 3),
	(164, 'test', '2025-11-17 15:05:35.443094', 23, 'SECTOR', NULL, NULL, 3),
	(165, 'test message 1', '2025-11-17 15:25:03.842691', 24, 'SECTOR', NULL, NULL, 3),
	(166, 'test message 2', '2025-11-17 15:25:06.450165', 24, 'SECTOR', NULL, NULL, 3),
	(167, 'test message 3 !', '2025-11-17 15:25:09.362018', 24, 'SECTOR', NULL, NULL, 3),
	(168, 'test faction 1', '2025-11-17 15:25:13.995470', 24, 'FACTION', 2, NULL, NULL),
	(169, 'test', '2025-11-18 14:14:17.928133', 61, 'SECTOR', NULL, NULL, 4),
	(170, 'test231231312312313', '2025-12-02 14:28:11.327020', 23, 'SECTOR', NULL, NULL, 3),
	(171, 'test153', '2025-12-02 14:29:02.762017', 23, 'SECTOR', NULL, NULL, 3),
	(172, 'qsdqsdd', '2025-12-02 14:29:38.536885', 23, 'FACTION', 2, NULL, NULL),
	(173, 'test', '2025-12-02 14:34:28.485008', 23, 'SECTOR', NULL, NULL, 3),
	(174, 'test2', '2025-12-02 14:35:48.892005', 23, 'SECTOR', NULL, NULL, 3),
	(175, 'test3', '2025-12-02 14:36:05.119972', 24, 'SECTOR', NULL, NULL, 3),
	(176, 'test', '2025-12-02 16:31:32.536315', 23, 'SECTOR', NULL, NULL, 3),
	(177, 'test', '2025-12-02 16:31:32.595339', 23, 'SECTOR', NULL, NULL, 3),
	(178, 'test', '2025-12-02 16:32:03.792312', 23, 'SECTOR', NULL, NULL, 3),
	(179, 'qsdqsdq', '2025-12-02 17:50:13.535206', 23, 'SECTOR', NULL, NULL, 3),
	(180, 'test', '2025-12-03 07:29:33.342498', 23, 'SECTOR', NULL, NULL, 3),
	(181, 'qsdqsdqsdqsdqs', '2025-12-03 07:34:20.529549', 24, 'SECTOR', NULL, NULL, 3),
	(182, 'test chat mdr', '2025-12-04 12:50:07.987791', 23, 'SECTOR', NULL, NULL, 3),
	(183, 'ouai !', '2025-12-04 12:50:15.806273', 24, 'SECTOR', NULL, NULL, 3),
	(184, 'qsdqdsqdsq', '2025-12-15 14:33:48.896122', 62, 'SECTOR', NULL, NULL, 3),
	(185, 'test', '2025-12-15 14:34:26.237528', 62, 'FACTION', 4, NULL, NULL),
	(186, 'qsdqdqd', '2025-12-15 14:39:56.372448', 62, 'SECTOR', NULL, NULL, 3),
	(187, 'qsdqdqsd', '2025-12-15 14:43:05.118269', 62, 'SECTOR', NULL, NULL, 3),
	(188, 'qsdqdqd', '2025-12-15 14:49:01.352043', 23, 'SECTOR', NULL, NULL, 3),
	(189, 'qsdqdqd', '2025-12-15 14:49:07.040592', 62, 'SECTOR', NULL, NULL, 3),
	(190, 'qsdqdq', '2025-12-15 14:49:52.661654', 62, 'SECTOR', NULL, NULL, 3),
	(191, 'qsdqsd', '2025-12-15 14:50:47.542563', 23, 'SECTOR', NULL, NULL, 3),
	(192, 'qsdqddsq', '2025-12-15 14:50:52.031073', 23, 'FACTION', 2, NULL, NULL),
	(193, 'test', '2025-12-16 07:30:02.609190', 62, 'SECTOR', NULL, NULL, 3),
	(194, 'ok', '2025-12-16 12:03:01.617078', 23, 'SECTOR', NULL, NULL, 3),
	(195, 'qsdqds', '2025-12-17 13:05:42.248293', 62, 'SECTOR', NULL, NULL, 3),
	(196, 'test', '2025-12-20 12:00:02.846688', 24, 'SECTOR', NULL, NULL, 3),
	(197, 'test2', '2025-12-20 12:01:59.990554', 62, 'SECTOR', NULL, NULL, 3),
	(198, 'test', '2026-01-03 10:15:02.488894', 23, 'SECTOR', NULL, NULL, 3),
	(199, 'test2', '2026-01-07 08:37:52.075596', 24, 'SECTOR', NULL, NULL, 3),
	(200, 'qsdqsdd', '2026-01-12 13:47:01.040477', 25, 'SECTOR', NULL, NULL, 3),
	(201, 'qsdqsdqsdqd', '2026-01-12 13:53:03.980974', 25, 'SECTOR', NULL, NULL, 3),
	(202, 'qsdqsdqsdsq', '2026-01-12 13:53:11.548690', 25, 'SECTOR', NULL, NULL, 3),
	(203, 'test', '2026-01-21 10:19:14.425099', 25, 'SECTOR', NULL, NULL, 3);
/*!40000 ALTER TABLE `core_message` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_messagereadstatus
CREATE TABLE IF NOT EXISTS `core_messagereadstatus` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `is_read` tinyint(1) NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `message_id` bigint(20) NOT NULL,
  `player_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_messagereadstatus_player_id_message_id_f16a77ed_uniq` (`player_id`,`message_id`),
  KEY `core_messag_player__340d19_idx` (`player_id`,`is_read`),
  KEY `core_messag_message_14a054_idx` (`message_id`,`is_read`),
  CONSTRAINT `core_messagereadstatus_message_id_3059a795_fk_core_message_id` FOREIGN KEY (`message_id`) REFERENCES `core_message` (`id`),
  CONSTRAINT `core_messagereadstatus_player_id_daeec30d_fk_core_player_id` FOREIGN KEY (`player_id`) REFERENCES `core_player` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=320 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_messagereadstatus : ~186 rows (environ)
DELETE FROM `core_messagereadstatus`;
/*!40000 ALTER TABLE `core_messagereadstatus` DISABLE KEYS */;
INSERT INTO `core_messagereadstatus` (`id`, `is_read`, `read_at`, `created_at`, `message_id`, `player_id`) VALUES
	(1, 1, '2025-11-17 15:02:10.721847', '2025-11-17 14:27:43.329054', 155, 23),
	(2, 1, '2025-12-11 10:33:46.813903', '2025-11-17 14:27:43.329054', 155, 25),
	(3, 1, '2025-11-19 20:20:41.904666', '2025-11-17 14:27:43.329054', 155, 26),
	(6, 1, '2025-11-17 14:27:43.329054', '2025-11-17 14:27:43.329054', 155, 24),
	(7, 1, '2025-11-17 15:03:27.727750', '2025-11-17 14:42:07.620237', 156, 24),
	(8, 1, '2025-12-11 10:33:46.813903', '2025-11-17 14:42:07.620237', 156, 25),
	(9, 1, '2025-11-19 20:20:41.904666', '2025-11-17 14:42:07.620237', 156, 26),
	(12, 1, '2025-11-17 14:42:07.620237', '2025-11-17 14:42:07.620237', 156, 23),
	(13, 1, '2025-11-17 15:02:10.721847', '2025-11-17 14:42:24.232048', 157, 23),
	(14, 1, '2025-12-11 10:33:46.813903', '2025-11-17 14:42:24.232048', 157, 25),
	(15, 1, '2025-11-19 20:20:41.904666', '2025-11-17 14:42:24.232048', 157, 26),
	(18, 1, '2025-11-17 14:42:24.232048', '2025-11-17 14:42:24.232048', 157, 24),
	(19, 1, '2025-11-17 15:02:10.721847', '2025-11-17 14:42:25.752349', 158, 23),
	(20, 1, '2025-12-11 10:33:46.813903', '2025-11-17 14:42:25.752349', 158, 25),
	(21, 1, '2025-11-19 20:20:41.904666', '2025-11-17 14:42:25.752349', 158, 26),
	(24, 1, '2025-11-17 14:42:25.752349', '2025-11-17 14:42:25.752349', 158, 24),
	(25, 1, '2025-11-17 15:02:10.721847', '2025-11-17 14:42:27.465284', 159, 23),
	(26, 1, '2025-12-11 10:33:46.813903', '2025-11-17 14:42:27.465284', 159, 25),
	(27, 1, '2025-11-19 20:20:41.904666', '2025-11-17 14:42:27.465284', 159, 26),
	(30, 1, '2025-11-17 14:42:27.465284', '2025-11-17 14:42:27.465284', 159, 24),
	(31, 0, NULL, '2025-11-17 14:42:30.901931', 160, 22),
	(32, 1, '2025-11-17 15:02:14.277197', '2025-11-17 14:42:30.901931', 160, 23),
	(37, 1, '2025-11-17 14:42:30.901931', '2025-11-17 14:42:30.901931', 160, 24),
	(38, 1, '2025-11-17 15:02:10.721847', '2025-11-17 14:45:14.571483', 161, 23),
	(39, 1, '2025-12-11 10:33:46.813903', '2025-11-17 14:45:14.571483', 161, 25),
	(40, 1, '2025-11-19 20:20:41.904666', '2025-11-17 14:45:14.571483', 161, 26),
	(43, 1, '2025-11-17 14:45:14.571483', '2025-11-17 14:45:14.571483', 161, 24),
	(44, 1, '2025-11-17 15:02:10.721847', '2025-11-17 14:45:18.670153', 162, 23),
	(45, 1, '2025-12-11 10:33:46.813903', '2025-11-17 14:45:18.670153', 162, 25),
	(46, 1, '2025-11-19 20:20:41.904666', '2025-11-17 14:45:18.670153', 162, 26),
	(49, 1, '2025-11-17 14:45:18.670153', '2025-11-17 14:45:18.670153', 162, 24),
	(50, 1, '2025-11-17 15:02:10.721847', '2025-11-17 14:45:34.822419', 163, 23),
	(51, 1, '2025-12-11 10:33:46.813903', '2025-11-17 14:45:34.822419', 163, 25),
	(52, 1, '2025-11-19 20:20:41.904666', '2025-11-17 14:45:34.822419', 163, 26),
	(55, 1, '2025-11-17 14:45:34.822419', '2025-11-17 14:45:34.822419', 163, 24),
	(56, 1, '2025-11-17 15:05:40.927166', '2025-11-17 15:05:35.463851', 164, 24),
	(57, 1, '2025-12-11 10:33:46.813903', '2025-11-17 15:05:35.463851', 164, 25),
	(58, 1, '2025-11-19 20:20:41.904666', '2025-11-17 15:05:35.463851', 164, 26),
	(61, 1, '2025-11-17 15:05:35.463851', '2025-11-17 15:05:35.463851', 164, 23),
	(62, 1, '2025-11-17 15:25:24.431825', '2025-11-17 15:25:03.873691', 165, 23),
	(63, 1, '2025-12-11 10:33:46.813903', '2025-11-17 15:25:03.873691', 165, 25),
	(64, 1, '2025-11-19 20:20:41.904666', '2025-11-17 15:25:03.873691', 165, 26),
	(67, 1, '2025-11-17 15:25:03.873691', '2025-11-17 15:25:03.873691', 165, 24),
	(68, 1, '2025-11-17 15:25:24.431825', '2025-11-17 15:25:06.462165', 166, 23),
	(69, 1, '2025-12-11 10:33:46.813903', '2025-11-17 15:25:06.462165', 166, 25),
	(70, 1, '2025-11-19 20:20:41.904666', '2025-11-17 15:25:06.462165', 166, 26),
	(73, 1, '2025-11-17 15:25:06.462165', '2025-11-17 15:25:06.462165', 166, 24),
	(74, 1, '2025-11-17 15:25:24.431825', '2025-11-17 15:25:09.377435', 167, 23),
	(75, 1, '2025-12-11 10:33:46.813903', '2025-11-17 15:25:09.377435', 167, 25),
	(76, 1, '2025-11-19 20:20:41.904666', '2025-11-17 15:25:09.377435', 167, 26),
	(79, 1, '2025-11-17 15:25:09.377435', '2025-11-17 15:25:09.377435', 167, 24),
	(80, 0, NULL, '2025-11-17 15:25:14.015736', 168, 22),
	(81, 1, '2025-11-17 15:25:27.557522', '2025-11-17 15:25:14.015736', 168, 23),
	(86, 1, '2025-11-17 15:25:14.015736', '2025-11-17 15:25:14.015736', 168, 24),
	(87, 0, NULL, '2025-11-18 14:14:17.951180', 169, 22),
	(100, 1, '2025-11-18 14:14:17.951180', '2025-11-18 14:14:17.951180', 169, 61),
	(101, 1, '2025-12-02 14:34:33.598076', '2025-12-02 14:28:11.356761', 170, 24),
	(102, 1, '2025-12-11 10:33:46.813903', '2025-12-02 14:28:11.356761', 170, 25),
	(103, 0, NULL, '2025-12-02 14:28:11.356761', 170, 26),
	(106, 1, '2025-12-02 14:28:11.356761', '2025-12-02 14:28:11.356761', 170, 23),
	(107, 1, '2025-12-02 14:34:33.598076', '2025-12-02 14:29:02.780268', 171, 24),
	(108, 1, '2025-12-11 10:33:46.813903', '2025-12-02 14:29:02.780268', 171, 25),
	(109, 0, NULL, '2025-12-02 14:29:02.780268', 171, 26),
	(112, 1, '2025-12-02 14:29:02.780268', '2025-12-02 14:29:02.780268', 171, 23),
	(113, 0, NULL, '2025-12-02 14:29:38.556466', 172, 22),
	(114, 1, '2025-12-02 14:34:39.996432', '2025-12-02 14:29:38.556466', 172, 24),
	(119, 1, '2025-12-02 14:29:38.556466', '2025-12-02 14:29:38.556466', 172, 23),
	(120, 1, '2025-12-02 14:34:33.598076', '2025-12-02 14:34:28.509347', 173, 24),
	(121, 1, '2025-12-11 10:33:46.813903', '2025-12-02 14:34:28.509347', 173, 25),
	(122, 0, NULL, '2025-12-02 14:34:28.509347', 173, 26),
	(125, 1, '2025-12-02 14:34:28.509347', '2025-12-02 14:34:28.509347', 173, 23),
	(126, 1, '2025-12-02 14:35:49.096724', '2025-12-02 14:35:48.910209', 174, 24),
	(127, 1, '2025-12-11 10:33:46.813903', '2025-12-02 14:35:48.910209', 174, 25),
	(128, 0, NULL, '2025-12-02 14:35:48.910209', 174, 26),
	(131, 1, '2025-12-02 14:35:48.910209', '2025-12-02 14:35:48.910209', 174, 23),
	(132, 1, '2025-12-02 14:36:07.704558', '2025-12-02 14:36:05.139937', 175, 23),
	(133, 1, '2025-12-11 10:33:46.813903', '2025-12-02 14:36:05.139937', 175, 25),
	(134, 0, NULL, '2025-12-02 14:36:05.139937', 175, 26),
	(137, 1, '2025-12-02 14:36:05.139937', '2025-12-02 14:36:05.139937', 175, 24),
	(138, 1, '2025-12-03 07:34:18.241222', '2025-12-02 16:31:32.552549', 176, 24),
	(139, 1, '2025-12-11 10:33:46.813903', '2025-12-02 16:31:32.552549', 176, 25),
	(140, 0, NULL, '2025-12-02 16:31:32.552549', 176, 26),
	(143, 1, '2025-12-02 16:31:32.552549', '2025-12-02 16:31:32.552549', 176, 23),
	(144, 1, '2025-12-03 07:34:18.241222', '2025-12-02 16:31:32.645702', 177, 24),
	(145, 1, '2025-12-11 10:33:46.813903', '2025-12-02 16:31:32.645702', 177, 25),
	(146, 0, NULL, '2025-12-02 16:31:32.645702', 177, 26),
	(149, 1, '2025-12-02 16:31:32.645702', '2025-12-02 16:31:32.645702', 177, 23),
	(150, 1, '2025-12-03 07:34:18.241222', '2025-12-02 16:32:03.807640', 178, 24),
	(151, 1, '2025-12-11 10:33:46.813903', '2025-12-02 16:32:03.807640', 178, 25),
	(152, 0, NULL, '2025-12-02 16:32:03.807640', 178, 26),
	(155, 1, '2025-12-02 16:32:03.807640', '2025-12-02 16:32:03.807640', 178, 23),
	(156, 1, '2025-12-03 07:34:18.241222', '2025-12-02 17:50:13.567926', 179, 24),
	(157, 1, '2025-12-11 10:33:46.813903', '2025-12-02 17:50:13.567926', 179, 25),
	(158, 0, NULL, '2025-12-02 17:50:13.567926', 179, 26),
	(161, 1, '2025-12-02 17:50:13.567926', '2025-12-02 17:50:13.567926', 179, 23),
	(162, 1, '2025-12-03 07:34:18.241222', '2025-12-03 07:29:33.368186', 180, 24),
	(163, 1, '2025-12-11 10:33:46.813903', '2025-12-03 07:29:33.368186', 180, 25),
	(164, 0, NULL, '2025-12-03 07:29:33.368186', 180, 26),
	(167, 1, '2025-12-03 07:29:33.368186', '2025-12-03 07:29:33.368186', 180, 23),
	(168, 1, '2025-12-03 07:34:24.962678', '2025-12-03 07:34:20.548194', 181, 23),
	(169, 1, '2025-12-11 10:33:46.813903', '2025-12-03 07:34:20.548194', 181, 25),
	(170, 0, NULL, '2025-12-03 07:34:20.548194', 181, 26),
	(173, 1, '2025-12-03 07:34:20.548194', '2025-12-03 07:34:20.548194', 181, 24),
	(174, 1, '2025-12-04 12:50:11.808094', '2025-12-04 12:50:08.009792', 182, 24),
	(175, 1, '2025-12-11 10:33:46.813903', '2025-12-04 12:50:08.009792', 182, 25),
	(176, 0, NULL, '2025-12-04 12:50:08.009792', 182, 26),
	(179, 1, '2025-12-04 12:50:08.009792', '2025-12-04 12:50:08.009792', 182, 23),
	(180, 1, '2025-12-04 12:50:15.957760', '2025-12-04 12:50:15.815274', 183, 23),
	(181, 1, '2025-12-11 10:33:46.813903', '2025-12-04 12:50:15.815274', 183, 25),
	(182, 0, NULL, '2025-12-04 12:50:15.815274', 183, 26),
	(185, 1, '2025-12-04 12:50:15.815274', '2025-12-04 12:50:15.815274', 183, 24),
	(215, 1, '2025-12-19 08:24:09.216006', '2025-12-15 14:49:01.374559', 188, 24),
	(216, 0, NULL, '2025-12-15 14:49:01.374559', 188, 25),
	(217, 0, NULL, '2025-12-15 14:49:01.374559', 188, 26),
	(220, 1, '2025-12-15 14:49:01.553253', '2025-12-15 14:49:01.374559', 188, 62),
	(221, 1, '2025-12-15 14:49:01.376559', '2025-12-15 14:49:01.376559', 188, 23),
	(222, 1, '2025-12-15 14:49:07.299883', '2025-12-15 14:49:07.062592', 189, 23),
	(223, 1, '2025-12-19 08:24:09.216006', '2025-12-15 14:49:07.062592', 189, 24),
	(224, 0, NULL, '2025-12-15 14:49:07.062592', 189, 25),
	(225, 0, NULL, '2025-12-15 14:49:07.062592', 189, 26),
	(228, 1, '2025-12-15 14:49:07.064590', '2025-12-15 14:49:07.064590', 189, 62),
	(229, 1, '2025-12-15 14:50:42.537376', '2025-12-15 14:49:52.682549', 190, 23),
	(230, 1, '2025-12-19 08:24:09.216006', '2025-12-15 14:49:52.682549', 190, 24),
	(231, 0, NULL, '2025-12-15 14:49:52.682549', 190, 25),
	(232, 0, NULL, '2025-12-15 14:49:52.682549', 190, 26),
	(235, 1, '2025-12-15 14:49:52.684549', '2025-12-15 14:49:52.684549', 190, 62),
	(236, 1, '2025-12-19 08:24:09.216006', '2025-12-15 14:50:47.575443', 191, 24),
	(237, 0, NULL, '2025-12-15 14:50:47.575443', 191, 25),
	(238, 0, NULL, '2025-12-15 14:50:47.575443', 191, 26),
	(241, 1, '2025-12-15 14:50:47.722965', '2025-12-15 14:50:47.575443', 191, 62),
	(242, 1, '2025-12-15 14:50:47.576441', '2025-12-15 14:50:47.576441', 191, 23),
	(243, 0, NULL, '2025-12-15 14:50:52.054429', 192, 22),
	(244, 1, '2025-12-19 08:24:13.612484', '2025-12-15 14:50:52.054429', 192, 24),
	(249, 1, '2025-12-15 14:50:52.055430', '2025-12-15 14:50:52.055430', 192, 23),
	(250, 1, '2025-12-16 12:02:50.170557', '2025-12-16 07:30:02.635422', 193, 23),
	(251, 1, '2025-12-19 08:24:09.216006', '2025-12-16 07:30:02.635422', 193, 24),
	(252, 0, NULL, '2025-12-16 07:30:02.635422', 193, 25),
	(253, 0, NULL, '2025-12-16 07:30:02.635422', 193, 26),
	(256, 1, '2025-12-16 07:30:02.636481', '2025-12-16 07:30:02.636481', 193, 62),
	(257, 1, '2025-12-19 08:24:09.216006', '2025-12-16 12:03:01.648080', 194, 24),
	(258, 0, NULL, '2025-12-16 12:03:01.648080', 194, 25),
	(259, 0, NULL, '2025-12-16 12:03:01.648080', 194, 26),
	(262, 1, '2025-12-16 13:37:15.766608', '2025-12-16 12:03:01.648080', 194, 62),
	(263, 1, '2025-12-16 12:03:01.649079', '2025-12-16 12:03:01.649079', 194, 23),
	(264, 1, '2025-12-17 13:05:58.859275', '2025-12-17 13:05:42.282816', 195, 23),
	(265, 1, '2025-12-19 08:24:09.216006', '2025-12-17 13:05:42.282816', 195, 24),
	(266, 0, NULL, '2025-12-17 13:05:42.282816', 195, 25),
	(267, 0, NULL, '2025-12-17 13:05:42.282816', 195, 26),
	(270, 1, '2025-12-17 13:05:42.333588', '2025-12-17 13:05:42.333588', 195, 62),
	(271, 0, NULL, '2025-12-20 12:00:02.873231', 196, 23),
	(272, 0, NULL, '2025-12-20 12:00:02.873231', 196, 25),
	(273, 0, NULL, '2025-12-20 12:00:02.873231', 196, 26),
	(276, 1, '2025-12-20 12:01:56.813564', '2025-12-20 12:00:02.873231', 196, 62),
	(277, 1, '2025-12-20 12:00:02.874231', '2025-12-20 12:00:02.874231', 196, 24),
	(278, 0, NULL, '2025-12-20 12:02:00.014811', 197, 23),
	(279, 1, '2025-12-20 12:02:04.113949', '2025-12-20 12:02:00.014811', 197, 24),
	(280, 0, NULL, '2025-12-20 12:02:00.014811', 197, 25),
	(281, 0, NULL, '2025-12-20 12:02:00.014811', 197, 26),
	(284, 1, '2025-12-20 12:02:00.016810', '2025-12-20 12:02:00.016810', 197, 62),
	(285, 1, '2026-01-07 08:37:46.245068', '2026-01-03 10:15:02.521894', 198, 24),
	(286, 0, NULL, '2026-01-03 10:15:02.522893', 198, 25),
	(287, 0, NULL, '2026-01-03 10:15:02.522893', 198, 26),
	(290, 0, NULL, '2026-01-03 10:15:02.522893', 198, 62),
	(291, 1, '2026-01-03 10:15:02.523893', '2026-01-03 10:15:02.523893', 198, 23),
	(292, 1, '2026-01-18 09:59:45.740291', '2026-01-07 08:37:52.109786', 199, 23),
	(293, 0, NULL, '2026-01-07 08:37:52.109786', 199, 26),
	(294, 0, NULL, '2026-01-07 08:37:52.109786', 199, 62),
	(295, 1, '2026-01-07 08:37:52.111797', '2026-01-07 08:37:52.111797', 199, 24),
	(296, 1, '2026-01-18 09:59:45.740291', '2026-01-12 13:47:01.087473', 200, 23),
	(297, 1, '2026-01-12 13:51:21.080645', '2026-01-12 13:47:01.087473', 200, 24),
	(298, 0, NULL, '2026-01-12 13:47:01.087473', 200, 26),
	(299, 0, NULL, '2026-01-12 13:47:01.087473', 200, 62),
	(300, 0, NULL, '2026-01-12 13:47:01.087473', 200, 68),
	(301, 1, '2026-01-12 13:47:01.089474', '2026-01-12 13:47:01.089474', 200, 25),
	(302, 1, '2026-01-18 09:59:45.740291', '2026-01-12 13:53:03.996494', 201, 23),
	(303, 1, '2026-01-12 13:53:04.158563', '2026-01-12 13:53:03.996494', 201, 24),
	(304, 0, NULL, '2026-01-12 13:53:03.996494', 201, 26),
	(305, 0, NULL, '2026-01-12 13:53:03.996494', 201, 62),
	(306, 0, NULL, '2026-01-12 13:53:03.996494', 201, 68),
	(307, 1, '2026-01-12 13:53:03.998498', '2026-01-12 13:53:03.998498', 201, 25),
	(308, 1, '2026-01-18 09:59:45.740291', '2026-01-12 13:53:11.561687', 202, 23),
	(309, 1, '2026-01-12 13:53:11.734200', '2026-01-12 13:53:11.561687', 202, 24),
	(310, 0, NULL, '2026-01-12 13:53:11.561687', 202, 26),
	(311, 0, NULL, '2026-01-12 13:53:11.561687', 202, 62),
	(312, 0, NULL, '2026-01-12 13:53:11.561687', 202, 68),
	(313, 1, '2026-01-12 13:53:11.563687', '2026-01-12 13:53:11.563687', 202, 25),
	(314, 0, NULL, '2026-01-21 10:19:14.519444', 203, 23),
	(315, 0, NULL, '2026-01-21 10:19:14.519444', 203, 24),
	(316, 0, NULL, '2026-01-21 10:19:14.519444', 203, 26),
	(317, 0, NULL, '2026-01-21 10:19:14.519444', 203, 62),
	(318, 0, NULL, '2026-01-21 10:19:14.519444', 203, 68),
	(319, 1, '2026-01-21 10:19:14.520444', '2026-01-21 10:19:14.520444', 203, 25);
/*!40000 ALTER TABLE `core_messagereadstatus` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_module
CREATE TABLE IF NOT EXISTS `core_module` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `tier` smallint(6) NOT NULL,
  `type` varchar(30) NOT NULL,
  `effect` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_module : ~114 rows (environ)
DELETE FROM `core_module`;
/*!40000 ALTER TABLE `core_module` DISABLE KEYS */;
INSERT INTO `core_module` (`id`, `name`, `description`, `tier`, `type`, `effect`, `created_at`, `updated_at`) VALUES
	(1, 'Ballistic shield lv-1', '', 1, 'DEFENSE_BALLISTIC', '{"label": "ballistic defense", "defense": 10, "defense_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(2, 'Ballistic shield lv-2', '', 2, 'DEFENSE_BALLISTIC', '{"label": "ballistic defense", "defense": 20, "defense_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(3, 'Ballistic shield lv-3', '', 3, 'DEFENSE_BALLISTIC', '{"label": "ballistic defense", "defense": 30, "defense_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(4, 'Ballistic shield lv-4', '', 4, 'DEFENSE_BALLISTIC', '{"label": "ballistic defense", "defense": 40, "defense_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(5, 'Ballistic shield lv-5', '', 5, 'DEFENSE_BALLISTIC', '{"label": "ballistic defense", "defense": 50, "defense_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(6, 'Ballistic shield lv-6', '', 6, 'DEFENSE_BALLISTIC', '{"label": "ballistic defense", "defense": 60, "defense_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(7, 'Ballistic shield lv-7', '', 7, 'DEFENSE_BALLISTIC', '{"label": "ballistic defense", "defense": 70, "defense_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(8, 'Thermal shield lv-1', '', 1, 'DEFENSE_THERMAL', '{"label": "thermal defense", "defense": 10, "defense_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(9, 'Thermal shield lv-1', '', 2, 'DEFENSE_THERMAL', '{"label": "thermal defense", "defense": 20, "defense_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(10, 'Thermal shield lv-2', '', 3, 'DEFENSE_THERMAL', '{"label": "thermal defense", "defense": 30, "defense_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(11, 'Thermal shield lv-3', '', 4, 'DEFENSE_THERMAL', '{"label": "thermal defense", "defense": 40, "defense_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(12, 'Thermal shield lv-4', '', 5, 'DEFENSE_THERMAL', '{"label": "thermal defense", "defense": 50, "defense_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(13, 'Thermal shield lv-5', '', 6, 'DEFENSE_THERMAL', '{"label": "thermal defense", "defense": 60, "defense_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(14, 'Thermal shield lv-6', '', 7, 'DEFENSE_THERMAL', '{"label": "thermal defense", "defense": 70, "defense_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(15, 'Missile shield lv-1', '', 1, 'DEFENSE_MISSILE', '{"label": "missile defense", "defense": 10, "defense_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(16, 'Missile shield lv-2', '', 2, 'DEFENSE_MISSILE', '{"label": "missile defense", "defense": 20, "defense_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(17, 'Missile shield lv-3', '', 3, 'DEFENSE_MISSILE', '{"label": "missile defense", "defense": 30, "defense_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(18, 'Missile shield lv-4', '', 4, 'DEFENSE_MISSILE', '{"label": "missile defense", "defense": 40, "defense_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(19, 'Missile shield lv-5', '', 5, 'DEFENSE_MISSILE', '{"label": "missile defense", "defense": 50, "defense_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(20, 'Missile shield lv-6', '', 6, 'DEFENSE_MISSILE', '{"label": "missile defense", "defense": 60, "defense_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(21, 'Missile shield lv-7', '', 7, 'DEFENSE_MISSILE', '{"label": "missile defense", "defense": 70, "defense_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(22, 'cargo hold lv-1', '', 1, 'HOLD', '{"label": "Hold capacity", "capacity": 300}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(23, 'cargo hold lv-2', '', 2, 'HOLD', '{"label": "Hold capacity", "capacity": 600}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(24, 'cargo hold lv-3', '', 3, 'HOLD', '{"label": "Hold capacity", "capacity": 900}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(25, 'cargo hold lv-4', '', 4, 'HOLD', '{"label": "Hold capacity", "capacity": 1200}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(26, 'cargo hold lv-5', '', 5, 'HOLD', '{"label": "Hold capacity", "capacity": 1500}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(27, 'cargo hold lv-6', '', 6, 'HOLD', '{"label": "Hold capacity", "capacity": 1800}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(28, 'cargo hold lv-7', '', 7, 'HOLD', '{"label": "Hold capacity", "capacity": 2000}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(29, 'propulsion lv-1', '', 1, 'MOVEMENT', '{"movement": 10}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(30, 'propulsion lv-2', '', 2, 'MOVEMENT', '{"movement": 15}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(31, 'propulsion lv-3', '', 3, 'MOVEMENT', '{"label": "bonus movement", "movement": 20}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(32, 'propulsion lv-4', '', 4, 'MOVEMENT', '{"label": "bonus movement", "movement": 25}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(33, 'propulsion lv-5', '', 5, 'MOVEMENT', '{"label": "bonus movement", "movement": 30}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(34, 'propulsion lv-6', '', 6, 'MOVEMENT', '{"label": "bonus movement", "movement": 35}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(35, 'propulsion lv-7', '', 7, 'MOVEMENT', '{"label": "bonus movement", "movement": 40}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(36, 'hull lv-1', '', 1, 'HULL', '{"hp": 50, "label": "Hull points"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(37, 'hull lv-2', '', 2, 'HULL', '{"hp": 75, "label": "Hull points"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(38, 'hull lv-3', '', 3, 'HULL', '{"hp": 100, "label": "Hull points"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(39, 'hull lv-4', '', 4, 'HULL', '{"hp": 125, "label": "Hull points"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(40, 'hull lv-5', '', 5, 'HULL', '{"hp": 150, "label": "Hull points"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(41, 'hull lv-6', '', 6, 'HULL', '{"hp": 175, "label": "Hull points"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(42, 'hull lv-7', '', 7, 'HULL', '{"hp": 200, "label": "Hull points"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(43, 'shield repaire lv-1', '', 1, 'REPAIRE', '{"label": "Shield repaire", "repair_shield": 10}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(44, 'shield repaire lv-2', '', 2, 'REPAIRE', '{"label": "Shield repaire", "repair_shield": 20}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(45, 'shield repaire lv-3', '', 3, 'REPAIRE', '{"label": "Shield repaire", "repair_shield": 30}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(46, 'shield repaire lv-4', '', 4, 'REPAIRE', '{"label": "Shield repaire", "repair_shield": 40}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(47, 'shield repaire lv-5', '', 5, 'REPAIRE', '{"label": "Shield repaire", "repair_shield": 50}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(48, 'shield repaire lv-6', '', 6, 'REPAIRE', '{"label": "Shield repaire", "repair_shield": 60}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(49, 'shield repaire lv-7', '', 7, 'REPAIRE', '{"label": "Shield repaire", "repair_shield": 70}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(50, 'mining lv-1', '', 1, 'GATHERING', '{"label": "Gathering amount", "range": 1, "gathering_amount": 15}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(51, 'mining lv-2', '', 2, 'GATHERING', '{"label": "Gathering amount", "range": 1, "gathering_amount": 30}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(52, 'mining lv-3', '', 3, 'GATHERING', '{"label": "Gathering amount", "range": 1, "gathering_amount": 45}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(53, 'mining lv-5', '', 5, 'GATHERING', '{"label": "Gathering amount", "range": 1, "gathering_amount": 75}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(54, 'mining lv-6', '', 6, 'GATHERING', '{"label": "Gathering amount", "range": 1, "gathering_amount": 90}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(55, 'mining lv-7', '', 7, 'GATHERING', '{"label": "Gathering amount", "range": 1, "gathering_amount": 105}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(56, 'scavenging module', '', 1, 'GATHERING', '{"label": "Allow to scavenge", "can_scavenge": true}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(57, 'research lab lv-1', '', 1, 'RESEARCH', '{"label": "Discrease research time", "research_time_discrease": 5}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(58, 'research lab lv-2', '', 2, 'RESEARCH', '{"label": "Discrease research time", "research_time_discrease": 10}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(59, 'research lab lv-3', '', 3, 'RESEARCH', '{"label": "Discrease research time", "research_time_discrease": 15}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(60, 'research lab lv-4', '', 4, 'RESEARCH', '{"label": "Discrease research time", "research_time_discrease": 20}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(61, 'research lab lv-5', '', 5, 'RESEARCH', '{"label": "Discrease research time", "research_time_discrease": 25}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(62, 'research lab lv-6', '', 6, 'RESEARCH', '{"label": "Discrease research time", "research_time_discrease": 30}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(63, 'research lab lv-7', '', 7, 'RESEARCH', '{"label": "Discrease research time", "research_time_discrease": 35}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(64, 'crafting station lv-1', '', 1, 'CRAFT', '{"label": "Manufacturing Level Allowed", "crafting_tier_allowed": 1}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(65, 'crafting station lv-2', '', 2, 'CRAFT', '{"label": "Manufacturing Level Allowed", "crafting_tier_allowed": 2}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(66, 'crafting station lv-3', '', 3, 'CRAFT', '{"label": "Manufacturing Level Allowed", "crafting_tier_allowed": 3}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(67, 'crafting station lv-4', '', 4, 'CRAFT', '{"label": "Manufacturing Level Allowed", "crafting_tier_allowed": 4}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(68, 'crafting station lv-5', '', 5, 'CRAFT', '{"label": "Manufacturing Level Allowed", "crafting_tier_allowed": 5}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(69, 'crafting station lv-6', '', 6, 'CRAFT', '{"label": "Manufacturing Level Allowed", "crafting_tier_allowed": 6}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(70, 'crafting station lv-7', '', 7, 'CRAFT', '{"label": "Manufacturing Level Allowed", "crafting_tier_allowed": 7}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(71, 'jammer lv-1', '', 1, 'ELECTRONIC_WARFARE', '{"label": "Lower aiming skill", "range": 5, "aiming_discrease": 15}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(72, 'jammer lv-2', '', 2, 'ELECTRONIC_WARFARE', '{"label": "Lower aiming skill", "range": 5, "aiming_discrease": 20}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(73, 'jammer lv-3', '', 3, 'ELECTRONIC_WARFARE', '{"label": "Lower aiming skill", "range": 5, "aiming_discrease": 25}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(74, 'jammer lv-4', '', 4, 'ELECTRONIC_WARFARE', '{"label": "Lower aiming skill", "range": 5, "aiming_discrease": 30}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(75, 'jammer lv-5', '', 5, 'ELECTRONIC_WARFARE', '{"label": "Lower aiming skill", "range": 5, "aiming_discrease": 35}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(76, 'jammer lv-6', '', 6, 'ELECTRONIC_WARFARE', '{"label": "Lower aiming skill", "range": 5, "aiming_discrease": 40}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(77, 'jammer lv-7', '', 7, 'ELECTRONIC_WARFARE', '{"label": "Lower aiming skill", "range": 5, "aiming_discrease": 45}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(78, 'targeting system lv-1', '', 1, 'WEAPONRY', '{"label": "Increase aiming skill", "aiming_increase": 5}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(79, 'targeting system lv-2', '', 2, 'WEAPONRY', '{"label": "Increase aiming skill", "aiming_increase": 10}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(80, 'targeting system lv-3', '', 3, 'WEAPONRY', '{"label": "Increase aiming skill", "aiming_increase": 15}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(81, 'targeting system lv-4', '', 4, 'WEAPONRY', '{"label": "Increase aiming skill", "aiming_increase": 20}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(82, 'targeting system lv-5', '', 5, 'WEAPONRY', '{"label": "Increase aiming skill", "aiming_increase": 25}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(83, 'targeting system lv-6', '', 6, 'WEAPONRY', '{"label": "Increase aiming skill", "aiming_increase": 30}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(84, 'targeting system lv-7', '', 7, 'WEAPONRY', '{"label": "Increase aiming skill", "aiming_increase": 35}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(85, 'speed bump lv-1', '', 1, 'ELECTRONIC_WARFARE', '{"label": "Lower movement points", "range": 5, "movement_discrease": 5}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(86, 'speed bump lv-2', '', 2, 'ELECTRONIC_WARFARE', '{"label": "Lower movement points", "range": 5, "movement_discrease": 10}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(87, 'speed bump lv-3', '', 3, 'ELECTRONIC_WARFARE', '{"label": "Lower movement points", "range": 5, "movement_discrease": 15}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(88, 'speed bump lv-4', '', 4, 'ELECTRONIC_WARFARE', '{"label": "Lower movement points", "range": 5, "movement_discrease": 20}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(89, 'speed bump lv-5', '', 5, 'ELECTRONIC_WARFARE', '{"label": "Lower movement points", "range": 5, "movement_discrease": 25}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(90, 'speed bump lv-6', '', 6, 'ELECTRONIC_WARFARE', '{"label": "Lower movement points", "range": 5, "movement_discrease": 30}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(91, 'speed bump lv-7', '', 7, 'ELECTRONIC_WARFARE', '{"label": "Lower movement points", "range": 5, "movement_discrease": 30}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(92, 'spaceship probe', '', 1, 'PROBE', '{"label": "Display ship data", "range": 20, "display_ship_data": true}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(93, 'drilling probe', '', 1, 'PROBE', '{"label": "Display harvestable resources", "range": 10, "display_mineral_data": true}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(94, 'Colonization module', '', 1, 'COLONIZATION', '{"label": "Allow to colonizate world", "can_colonizate_world": true}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(95, 'Ballistic weapon lv-1', '', 1, 'WEAPONRY', '{"label": "Ballistic damages", "range": 3, "max_damage": 10, "min_damage": 1, "damage_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(96, 'Ballistic weapon lv-2', '', 2, 'WEAPONRY', '{"label": "Ballistic damages", "range": 3, "max_damage": 15, "min_damage": 5, "damage_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(97, 'Ballistic weapon lv-3', '', 3, 'WEAPONRY', '{"label": "Ballistic damages", "range": 3, "max_damage": 20, "min_damage": 10, "damage_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(98, 'Ballistic weapon lv-4', '', 4, 'WEAPONRY', '{"label": "Ballistic damages", "range": 3, "max_damage": 25, "min_damage": 15, "damage_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(99, 'Ballistic weapon lv-5', '', 5, 'WEAPONRY', '{"label": "Ballistic damages", "range": 3, "max_damage": 30, "min_damage": 20, "damage_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(100, 'Ballistic weapon lv-7', '', 7, 'WEAPONRY', '{"label": "Ballistic damages", "range": 3, "max_damage": 40, "min_damage": 30, "damage_type": "ballistic"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(101, 'thermal weapon lv-1', '', 1, 'WEAPONRY', '{"label": "Thermal damages", "range": 10, "max_damage": 4, "min_damage": 4, "damage_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(102, 'thermal weapon lv-2', '', 2, 'WEAPONRY', '{"label": "Thermal damages", "range": 10, "max_damage": 8, "min_damage": 8, "damage_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(103, 'thermal weapon lv-3', '', 3, 'WEAPONRY', '{"label": "Thermal damages", "range": 10, "max_damage": 12, "min_damage": 12, "damage_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(104, 'thermal weapon lv-4', '', 4, 'WEAPONRY', '{"label": "Thermal damages", "range": 10, "max_damage": 16, "min_damage": 16, "damage_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(105, 'thermal weapon lv-5', '', 4, 'WEAPONRY', '{"label": "Thermal damages", "range": 10, "max_damage": 20, "min_damage": 20, "damage_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(106, 'thermal weapon lv-6', '', 6, 'WEAPONRY', '{"label": "Thermal damages", "range": 10, "max_damage": 24, "min_damage": 24, "damage_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(107, 'thermal weapon lv-7', '', 7, 'WEAPONRY', '{"label": "Thermal damages", "range": 10, "max_damage": 28, "min_damage": 28, "damage_type": "thermal"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(108, 'missile weapon lv-1', '', 1, 'WEAPONRY', '{"label": "missile damages", "range": 6, "max_damage": 15, "min_damage": 5, "damage_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(109, 'missile weapon lv-2', '', 2, 'WEAPONRY', '{"label": "missile damages", "range": 6, "max_damage": 25, "min_damage": 5, "damage_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(110, 'missile weapon lv-3', '', 3, 'WEAPONRY', '{"label": "missile damages", "range": 6, "max_damage": 35, "min_damage": 10, "damage_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(111, 'missile weapon lv-4', '', 4, 'WEAPONRY', '{"label": "missile damages", "range": 6, "max_damage": 45, "min_damage": 10, "damage_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(112, 'missile weapon lv-5', '', 5, 'WEAPONRY', '{"label": "missile damages", "range": 6, "max_damage": 55, "min_damage": 15, "damage_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(113, 'missile weapon lv-6', '', 6, 'WEAPONRY', '{"label": "missile damages", "range": 6, "max_damage": 65, "min_damage": 15, "damage_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000'),
	(114, 'missile weapon lv-7', '', 7, 'WEAPONRY', '{"label": "missile damages", "range": 6, "max_damage": 75, "min_damage": 20, "damage_type": "missile"}', '2024-06-04 12:38:15.000000', '2024-06-04 12:38:15.000000');
/*!40000 ALTER TABLE `core_module` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_npc
CREATE TABLE IF NOT EXISTS `core_npc` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `current_ap` int(10) unsigned NOT NULL,
  `max_ap` bigint(20) unsigned NOT NULL,
  `hp` smallint(6) NOT NULL,
  `movement` smallint(5) unsigned NOT NULL,
  `missile_defense` smallint(6) NOT NULL,
  `thermal_defense` smallint(6) NOT NULL,
  `ballistic_defense` smallint(6) NOT NULL,
  `coordinates` json DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `faction_id` bigint(20) NOT NULL,
  `npc_template_id` bigint(20) DEFAULT NULL,
  `sector_id` bigint(20) DEFAULT NULL,
  `max_hp` smallint(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_npc_npc_template_id_6dd21ca4_fk_core_npctemplate_id` (`npc_template_id`),
  KEY `core_npc_sector_id_9e050ccc_fk_core_sector_id` (`sector_id`),
  KEY `core_npc_faction_id_aad2546b_fk_core_faction_id` (`faction_id`),
  CONSTRAINT `core_npc_faction_id_aad2546b_fk_core_faction_id` FOREIGN KEY (`faction_id`) REFERENCES `core_faction` (`id`),
  CONSTRAINT `core_npc_npc_template_id_6dd21ca4_fk_core_npctemplate_id` FOREIGN KEY (`npc_template_id`) REFERENCES `core_npctemplate` (`id`),
  CONSTRAINT `core_npc_sector_id_9e050ccc_fk_core_sector_id` FOREIGN KEY (`sector_id`) REFERENCES `core_sector` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1233 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_npc : ~14 rows (environ)
DELETE FROM `core_npc`;
/*!40000 ALTER TABLE `core_npc` DISABLE KEYS */;
INSERT INTO `core_npc` (`id`, `current_ap`, `max_ap`, `hp`, `movement`, `missile_defense`, `thermal_defense`, `ballistic_defense`, `coordinates`, `status`, `created_at`, `updated_at`, `faction_id`, `npc_template_id`, `sector_id`, `max_hp`) VALUES
	(1219, 10, 10, 150, 20, 15, 10, 15, '{"x": "10", "y": "18"}', 'FULL', '2026-01-08 15:23:57.498419', '2026-01-08 15:23:57.500854', 1, 3, 3, 0),
	(1220, 10, 10, 150, 20, 15, 10, 15, '{"x": "23", "y": "25"}', 'FULL', '2026-01-08 15:23:57.522112', '2026-01-08 15:23:57.522112', 1, 3, 3, 0),
	(1221, 10, 10, 150, 20, 15, 10, 15, '{"x": "32", "y": "19"}', 'FULL', '2026-01-08 15:23:57.538112', '2026-01-08 15:23:57.538112', 1, 3, 3, 0),
	(1222, 10, 10, 150, 20, 15, 10, 15, '{"x": "33", "y": "5"}', 'FULL', '2026-01-08 15:23:57.554072', '2026-01-08 15:23:57.554072', 1, 3, 3, 0),
	(1223, 10, 10, 110, 40, 45, 25, 25, '{"x": "8", "y": "15"}', 'FULL', '2026-01-08 15:23:57.571416', '2026-01-08 15:23:57.571416', 1, 4, 3, 0),
	(1224, 10, 10, 110, 40, 45, 25, 25, '{"x": "27", "y": "30"}', 'FULL', '2026-01-08 15:23:57.588101', '2026-01-08 15:23:57.588101', 1, 4, 3, 0),
	(1225, 10, 10, 110, 40, 45, 25, 25, '{"x": "5", "y": "2"}', 'FULL', '2026-01-08 15:23:57.606085', '2026-01-08 15:23:57.606085', 1, 4, 3, 0),
	(1226, 10, 10, 150, 20, 15, 10, 15, '{"x": "4", "y": "8"}', 'FULL', '2026-01-08 15:24:59.197582', '2026-01-08 15:24:59.199201', 1, 3, 7, 0),
	(1227, 10, 10, 150, 20, 15, 10, 15, '{"x": "20", "y": "22"}', 'FULL', '2026-01-08 15:24:59.219813', '2026-01-08 15:24:59.220812', 1, 3, 7, 0),
	(1228, 10, 10, 150, 20, 15, 10, 15, '{"x": "32", "y": "19"}', 'FULL', '2026-01-08 15:24:59.235581', '2026-01-08 15:24:59.235581', 1, 3, 7, 0),
	(1229, 10, 10, 150, 20, 15, 10, 15, '{"x": "33", "y": "8"}', 'FULL', '2026-01-08 15:24:59.252776', '2026-01-08 15:24:59.253775', 1, 3, 7, 0),
	(1230, 10, 10, 110, 40, 45, 25, 25, '{"x": "12", "y": "15"}', 'FULL', '2026-01-08 15:24:59.268582', '2026-01-08 15:24:59.268582', 1, 4, 7, 0),
	(1231, 10, 10, 110, 40, 45, 25, 25, '{"x": "8", "y": "2"}', 'FULL', '2026-01-08 15:24:59.285954', '2026-01-08 15:24:59.286954', 1, 4, 7, 0),
	(1232, 10, 10, 110, 40, 45, 25, 25, '{"x": "24", "y": "22"}', 'FULL', '2026-01-08 15:24:59.301582', '2026-01-08 15:24:59.301582', 1, 4, 7, 0);
/*!40000 ALTER TABLE `core_npc` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_npcresource
CREATE TABLE IF NOT EXISTS `core_npcresource` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `quantity` int(10) unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `npc_id` bigint(20) NOT NULL,
  `resource_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_npcresource_npc_id_c4eda532_fk_core_npc_id` (`npc_id`),
  KEY `core_npcresource_resource_id_c2c6daab_fk_core_resource_id` (`resource_id`),
  CONSTRAINT `core_npcresource_npc_id_c4eda532_fk_core_npc_id` FOREIGN KEY (`npc_id`) REFERENCES `core_npc` (`id`),
  CONSTRAINT `core_npcresource_resource_id_c2c6daab_fk_core_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `core_resource` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_npcresource : ~0 rows (environ)
DELETE FROM `core_npcresource`;
/*!40000 ALTER TABLE `core_npcresource` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_npcresource` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_npctemplate
CREATE TABLE IF NOT EXISTS `core_npctemplate` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `difficulty` smallint(6) NOT NULL,
  `description` longtext NOT NULL,
  `module_id_list` json DEFAULT NULL,
  `max_hp` smallint(6) NOT NULL,
  `max_movement` smallint(5) unsigned NOT NULL,
  `max_missile_defense` smallint(6) NOT NULL,
  `max_thermal_defense` smallint(6) NOT NULL,
  `max_ballistic_defense` smallint(6) NOT NULL,
  `hold_capacity` smallint(6) NOT NULL,
  `behavior` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `ship_id` bigint(20) DEFAULT NULL,
  `displayed_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `core_npctemplate_ship_id_4c1808ea_fk_core_ship_id` (`ship_id`),
  CONSTRAINT `core_npctemplate_ship_id_4c1808ea_fk_core_ship_id` FOREIGN KEY (`ship_id`) REFERENCES `core_ship` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_npctemplate : ~2 rows (environ)
DELETE FROM `core_npctemplate`;
/*!40000 ALTER TABLE `core_npctemplate` DISABLE KEYS */;
INSERT INTO `core_npctemplate` (`id`, `name`, `difficulty`, `description`, `module_id_list`, `max_hp`, `max_movement`, `max_missile_defense`, `max_thermal_defense`, `max_ballistic_defense`, `hold_capacity`, `behavior`, `created_at`, `updated_at`, `ship_id`, `displayed_name`) VALUES
	(3, 'Light_Raider_Rookie', 15, '', '[1, 15, 22, 36, 29, 43, 95]', 150, 20, 15, 10, 15, 300, 'passive', '2026-01-08 15:14:00.646829', '2026-01-08 15:14:00.648833', 7, 'Light Raider'),
	(4, 'Medium_Raider_Rookie', 10, '', '[1, 16, 23, 37, 30, 102]', 110, 40, 45, 25, 25, 600, 'long_range', '2026-01-08 15:18:18.167443', '2026-01-08 15:18:18.169444', 5, 'Veterant Raider');
/*!40000 ALTER TABLE `core_npctemplate` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_npctemplateresource
CREATE TABLE IF NOT EXISTS `core_npctemplateresource` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `faction_xp` int(10) unsigned NOT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `can_be_randomized` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `npc_template_id` bigint(20) DEFAULT NULL,
  `resource_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `core_npctemplatereso_npc_template_id_0bde3334_fk_core_npct` (`npc_template_id`),
  KEY `core_npctemplatereso_resource_id_a1057148_fk_core_reso` (`resource_id`),
  CONSTRAINT `core_npctemplatereso_npc_template_id_0bde3334_fk_core_npct` FOREIGN KEY (`npc_template_id`) REFERENCES `core_npctemplate` (`id`),
  CONSTRAINT `core_npctemplatereso_resource_id_a1057148_fk_core_reso` FOREIGN KEY (`resource_id`) REFERENCES `core_resource` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_npctemplateresource : ~2 rows (environ)
DELETE FROM `core_npctemplateresource`;
/*!40000 ALTER TABLE `core_npctemplateresource` DISABLE KEYS */;
INSERT INTO `core_npctemplateresource` (`id`, `faction_xp`, `quantity`, `can_be_randomized`, `created_at`, `updated_at`, `npc_template_id`, `resource_id`) VALUES
	(3, 0, 0, 0, '2026-01-08 15:14:01.105734', '2026-01-08 15:14:01.106734', 3, 2),
	(4, 0, 150, 1, '2026-01-08 15:18:18.669198', '2026-01-08 15:18:18.669198', 4, 2);
/*!40000 ALTER TABLE `core_npctemplateresource` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_npctemplateskill
CREATE TABLE IF NOT EXISTS `core_npctemplateskill` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `level` smallint(5) unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `npc_template_id` bigint(20) DEFAULT NULL,
  `skill_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `core_npctemplateskil_npc_template_id_fa1546b0_fk_core_npct` (`npc_template_id`),
  KEY `core_npctemplateskill_skill_id_89db71c7_fk_core_skill_id` (`skill_id`),
  CONSTRAINT `core_npctemplateskil_npc_template_id_fa1546b0_fk_core_npct` FOREIGN KEY (`npc_template_id`) REFERENCES `core_npctemplate` (`id`),
  CONSTRAINT `core_npctemplateskill_skill_id_89db71c7_fk_core_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `core_skill` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_npctemplateskill : ~46 rows (environ)
DELETE FROM `core_npctemplateskill`;
/*!40000 ALTER TABLE `core_npctemplateskill` DISABLE KEYS */;
INSERT INTO `core_npctemplateskill` (`id`, `level`, `created_at`, `updated_at`, `npc_template_id`, `skill_id`) VALUES
	(47, 15, '2026-01-08 15:14:00.667016', '2026-01-08 15:14:00.667016', 3, 1),
	(48, 0, '2026-01-08 15:14:00.684309', '2026-01-08 15:14:00.684309', 3, 2),
	(49, 0, '2026-01-08 15:14:00.700057', '2026-01-08 15:14:00.700057', 3, 3),
	(50, 0, '2026-01-08 15:14:00.758566', '2026-01-08 15:14:00.758566', 3, 4),
	(51, 15, '2026-01-08 15:14:00.774503', '2026-01-08 15:14:00.774503', 3, 5),
	(52, 0, '2026-01-08 15:14:00.791505', '2026-01-08 15:14:00.791505', 3, 6),
	(53, 0, '2026-01-08 15:14:00.807739', '2026-01-08 15:14:00.807739', 3, 7),
	(54, 0, '2026-01-08 15:14:00.824995', '2026-01-08 15:14:00.824995', 3, 8),
	(55, 15, '2026-01-08 15:14:00.841037', '2026-01-08 15:14:00.841037', 3, 23),
	(56, 0, '2026-01-08 15:14:00.857448', '2026-01-08 15:14:00.858431', 3, 9),
	(57, 0, '2026-01-08 15:14:00.874318', '2026-01-08 15:14:00.874318', 3, 10),
	(58, 0, '2026-01-08 15:14:00.891309', '2026-01-08 15:14:00.891309', 3, 11),
	(59, 0, '2026-01-08 15:14:00.907526', '2026-01-08 15:14:00.907526', 3, 12),
	(60, 0, '2026-01-08 15:14:00.924426', '2026-01-08 15:14:00.924426', 3, 13),
	(61, 0, '2026-01-08 15:14:00.939735', '2026-01-08 15:14:00.940735', 3, 14),
	(62, 0, '2026-01-08 15:14:00.957234', '2026-01-08 15:14:00.957234', 3, 15),
	(63, 0, '2026-01-08 15:14:00.973243', '2026-01-08 15:14:00.973243', 3, 16),
	(64, 0, '2026-01-08 15:14:01.006734', '2026-01-08 15:14:01.006734', 3, 17),
	(65, 0, '2026-01-08 15:14:01.023388', '2026-01-08 15:14:01.023388', 3, 18),
	(66, 0, '2026-01-08 15:14:01.040312', '2026-01-08 15:14:01.040312', 3, 19),
	(67, 0, '2026-01-08 15:14:01.056167', '2026-01-08 15:14:01.056167', 3, 20),
	(68, 0, '2026-01-08 15:14:01.073431', '2026-01-08 15:14:01.073431', 3, 21),
	(69, 0, '2026-01-08 15:14:01.089735', '2026-01-08 15:14:01.089735', 3, 22),
	(70, 0, '2026-01-08 15:18:18.180442', '2026-01-08 15:18:18.180442', 4, 1),
	(71, 10, '2026-01-08 15:18:18.238443', '2026-01-08 15:18:18.239443', 4, 2),
	(72, 0, '2026-01-08 15:18:18.263638', '2026-01-08 15:18:18.263638', 4, 3),
	(73, 0, '2026-01-08 15:18:18.280408', '2026-01-08 15:18:18.280408', 4, 4),
	(74, 10, '2026-01-08 15:18:18.296580', '2026-01-08 15:18:18.296580', 4, 5),
	(75, 0, '2026-01-08 15:18:18.362646', '2026-01-08 15:18:18.362646', 4, 6),
	(76, 0, '2026-01-08 15:18:18.378646', '2026-01-08 15:18:18.379646', 4, 7),
	(77, 0, '2026-01-08 15:18:18.396350', '2026-01-08 15:18:18.396350', 4, 8),
	(78, 0, '2026-01-08 15:18:18.411582', '2026-01-08 15:18:18.411582', 4, 23),
	(79, 10, '2026-01-08 15:18:18.429467', '2026-01-08 15:18:18.429467', 4, 9),
	(80, 10, '2026-01-08 15:18:18.445477', '2026-01-08 15:18:18.445477', 4, 10),
	(81, 10, '2026-01-08 15:18:18.470380', '2026-01-08 15:18:18.470380', 4, 11),
	(82, 0, '2026-01-08 15:18:18.487089', '2026-01-08 15:18:18.487089', 4, 12),
	(83, 0, '2026-01-08 15:18:18.503982', '2026-01-08 15:18:18.503982', 4, 13),
	(84, 10, '2026-01-08 15:18:18.520168', '2026-01-08 15:18:18.520168', 4, 14),
	(85, 0, '2026-01-08 15:18:18.536479', '2026-01-08 15:18:18.536479', 4, 15),
	(86, 0, '2026-01-08 15:18:18.552501', '2026-01-08 15:18:18.553505', 4, 16),
	(87, 0, '2026-01-08 15:18:18.569957', '2026-01-08 15:18:18.569957', 4, 17),
	(88, 0, '2026-01-08 15:18:18.585583', '2026-01-08 15:18:18.586595', 4, 18),
	(89, 0, '2026-01-08 15:18:18.603209', '2026-01-08 15:18:18.603209', 4, 19),
	(90, 0, '2026-01-08 15:18:18.616092', '2026-01-08 15:18:18.616092', 4, 20),
	(91, 0, '2026-01-08 15:18:18.636087', '2026-01-08 15:18:18.636087', 4, 21),
	(92, 0, '2026-01-08 15:18:18.652501', '2026-01-08 15:18:18.652501', 4, 22);
/*!40000 ALTER TABLE `core_npctemplateskill` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_planet
CREATE TABLE IF NOT EXISTS `core_planet` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `data` json DEFAULT NULL,
  `size` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_planet : ~5 rows (environ)
DELETE FROM `core_planet`;
/*!40000 ALTER TABLE `core_planet` DISABLE KEYS */;
INSERT INTO `core_planet` (`id`, `name`, `data`, `size`, `created_at`, `updated_at`) VALUES
	(1, 'planete_1', '{"type": "planet", "animation": "planete_1"}', '{"x": 4, "y": 4}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(2, 'moon_1', '{"type": "satellite", "animation": "moon_1"}', '{"x": 3, "y": 3}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(3, 'star_1', '{"type": "star", "animation": "star_1"}', '{"x": 2, "y": 2}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(4, 'planete_2', '{"type": "planet", "animation": "planete_2"}', '{"x": 4, "y": 4}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(5, 'planete_3', '{"type": "planet", "animation": "planete_3"}', '{"x": 4, "y": 4}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000');
/*!40000 ALTER TABLE `core_planet` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_planetresource
CREATE TABLE IF NOT EXISTS `core_planetresource` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `quantity` int(10) unsigned NOT NULL,
  `data` json DEFAULT NULL,
  `coordinates` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `resource_id` bigint(20) DEFAULT NULL,
  `sector_id` bigint(20) NOT NULL,
  `source_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_planetresource_resource_id_3c8eac23_fk_core_resource_id` (`resource_id`),
  KEY `core_planetresource_sector_id_c4c0239c_fk_core_sector_id` (`sector_id`),
  KEY `core_planetresource_source_id_ad7cc218_fk_core_planet_id` (`source_id`),
  CONSTRAINT `core_planetresource_resource_id_3c8eac23_fk_core_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `core_resource` (`id`),
  CONSTRAINT `core_planetresource_sector_id_c4c0239c_fk_core_sector_id` FOREIGN KEY (`sector_id`) REFERENCES `core_sector` (`id`),
  CONSTRAINT `core_planetresource_source_id_ad7cc218_fk_core_planet_id` FOREIGN KEY (`source_id`) REFERENCES `core_planet` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_planetresource : ~9 rows (environ)
DELETE FROM `core_planetresource`;
/*!40000 ALTER TABLE `core_planetresource` DISABLE KEYS */;
INSERT INTO `core_planetresource` (`id`, `quantity`, `data`, `coordinates`, `created_at`, `updated_at`, `resource_id`, `sector_id`, `source_id`) VALUES
	(52, 0, '{"name": "p-1", "description": "dsqsdqdqd"}', '{"x": "4", "y": "21"}', '2025-07-08 07:00:29.768960', '2025-07-08 07:00:29.768960', 1, 4, 5),
	(53, 0, '{"name": "m-1", "description": "qsdqsd"}', '{"x": "21", "y": "11"}', '2025-07-08 07:00:29.884515', '2025-07-08 07:00:29.885514', 1, 4, 2),
	(54, 0, '{"name": "sdqsdqsd", "description": "qsdqsdd"}', '{"x": "13", "y": "2"}', '2025-07-08 07:00:29.967594', '2025-07-08 07:00:29.967594', 1, 4, 3),
	(78, 0, '{"name": "p-1", "description": "qsdqds"}', '{"x": "35", "y": "2"}', '2026-01-08 15:23:57.618083', '2026-01-08 15:23:57.619087', 1, 3, 1),
	(79, 0, '{"name": "p-2", "description": "qsdqds"}', '{"x": "4", "y": "16"}', '2026-01-08 15:23:57.635083', '2026-01-08 15:23:57.635083', 1, 3, 4),
	(80, 0, '{"name": "m-1", "description": "qsdqsd"}', '{"x": "8", "y": "28"}', '2026-01-08 15:23:57.991017', '2026-01-08 15:23:57.992022', 1, 3, 2),
	(81, 0, '{"name": "s-1", "description": "qsddqs"}', '{"x": "29", "y": "13"}', '2026-01-08 15:23:58.041573', '2026-01-08 15:23:58.041582', 1, 3, 3),
	(82, 0, '{"name": "p-1", "description": "une planete"}', '{"x": "3", "y": "3"}', '2026-01-08 15:24:59.316946', '2026-01-08 15:24:59.316946', 1, 7, 1),
	(83, 0, '{"name": "p3", "description": "p3aaaa"}', '{"x": "31", "y": "13"}', '2026-01-08 15:24:59.332865', '2026-01-08 15:24:59.333862', 1, 7, 5);
/*!40000 ALTER TABLE `core_planetresource` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_player
CREATE TABLE IF NOT EXISTS `core_player` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `is_npc` tinyint(1) NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `image` tinyint(1) NOT NULL,
  `faction_xp` int(10) unsigned NOT NULL,
  `current_ap` int(10) unsigned NOT NULL,
  `max_ap` bigint(20) unsigned NOT NULL,
  `coordinates` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `archetype_id` bigint(20) NOT NULL,
  `faction_id` bigint(20) NOT NULL,
  `sector_id` bigint(20) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `last_time_warpzone` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_player_sector_id_2b18fef8_fk_core_sector_id` (`sector_id`),
  KEY `core_player_user_id_345eee94_fk_auth_user_id` (`user_id`),
  KEY `core_player_archetype_id_4c2f9477_fk_core_archetype_id` (`archetype_id`),
  KEY `core_player_faction_id_9fc90d61_fk_core_faction_id` (`faction_id`),
  CONSTRAINT `core_player_archetype_id_4c2f9477_fk_core_archetype_id` FOREIGN KEY (`archetype_id`) REFERENCES `core_archetype` (`id`),
  CONSTRAINT `core_player_faction_id_9fc90d61_fk_core_faction_id` FOREIGN KEY (`faction_id`) REFERENCES `core_faction` (`id`),
  CONSTRAINT `core_player_sector_id_2b18fef8_fk_core_sector_id` FOREIGN KEY (`sector_id`) REFERENCES `core_sector` (`id`),
  CONSTRAINT `core_player_user_id_345eee94_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_player : ~8 rows (environ)
DELETE FROM `core_player`;
/*!40000 ALTER TABLE `core_player` DISABLE KEYS */;
INSERT INTO `core_player` (`id`, `is_npc`, `name`, `description`, `image`, `faction_xp`, `current_ap`, `max_ap`, `coordinates`, `created_at`, `updated_at`, `archetype_id`, `faction_id`, `sector_id`, `user_id`, `last_time_warpzone`) VALUES
	(22, 0, 'Belian', '<p>qdqsdqds</p>', 1, 0, 10, 10, '{"x": 17, "y": 3}', '2025-05-27 09:20:50.724552', '2025-05-27 09:20:50.724552', 2, 2, 3, 7, '2026-01-21 13:58:34.297698'),
	(23, 0, 'Deirdre', '<p><strong style="color: rgb(230, 0, 0);">Une description succinte ! </strong></p>', 1, 0, 10, 10, '{"x": 16, "y": 8}', '2025-05-27 12:49:55.333477', '2025-05-27 12:49:55.333477', 3, 2, 3, 1, '2026-01-07 07:37:56.944920'),
	(24, 0, 'Murthy', '<p><em>Une autre description tout à fait convenable...</em></p>', 1, 0, 8, 10, '{"x": 12, "y": 9}', '2025-05-27 12:51:51.615533', '2025-05-27 12:51:51.616530', 6, 2, 3, 2, '2026-01-13 14:26:25.790139'),
	(25, 0, 'Case', '<p><br></p>', 1, 0, 2, 10, '{"x": 16, "y": 3}', '2025-05-27 12:52:53.050374', '2025-05-27 12:52:53.050374', 4, 3, 3, 3, '2026-01-21 12:03:24.818256'),
	(26, 0, 'Billy', '<p class="ql-indent-1"><strong style="color: rgb(0, 138, 0);">Billy bob !</strong></p>', 0, 0, 10, 10, '{"x": 19, "y": 11}', '2025-05-27 12:53:25.736889', '2025-05-27 12:53:25.737914', 2, 4, 3, 4, '2025-11-13 14:07:51.954974'),
	(61, 0, '[REC] Gibson', '<p>admin...</p>', 0, 0, 10, 10, '{"x": 17, "y": 7}', '2025-11-18 13:30:07.646353', '2025-11-18 13:30:07.648354', 1, 4, 4, 34, '2025-11-18 13:30:07.646353'),
	(62, 0, 'recolteur', '<p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.</p>', 1, 0, 10, 10, '{"x": 11, "y": 9}', '2025-12-15 08:32:50.293807', '2025-12-15 08:32:50.294806', 2, 4, 3, 54, '2025-12-18 11:45:51.420330'),
	(68, 0, 'soldat3', '', 1, 0, 10, 10, '{"x": 14, "y": 3}', '2026-01-07 16:50:17.000000', '2026-01-07 16:51:09.293097', 1, 4, 3, 55, '2026-01-08 21:34:03.108863');
/*!40000 ALTER TABLE `core_player` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_playergroup
CREATE TABLE IF NOT EXISTS `core_playergroup` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `group_id` bigint(20) NOT NULL,
  `player_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_playergroup_group_id_ff25f1a5_fk_core_group_id` (`group_id`),
  KEY `core_playergroup_player_id_58935453_fk_core_player_id` (`player_id`),
  CONSTRAINT `core_playergroup_group_id_ff25f1a5_fk_core_group_id` FOREIGN KEY (`group_id`) REFERENCES `core_group` (`id`),
  CONSTRAINT `core_playergroup_player_id_58935453_fk_core_player_id` FOREIGN KEY (`player_id`) REFERENCES `core_player` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_playergroup : ~0 rows (environ)
DELETE FROM `core_playergroup`;
/*!40000 ALTER TABLE `core_playergroup` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_playergroup` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_playerlog
CREATE TABLE IF NOT EXISTS `core_playerlog` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `log_id` bigint(20) NOT NULL,
  `player_id` bigint(20) NOT NULL,
  `role` varchar(30) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_playerlog_log_id_b28833a6_fk_core_log_id` (`log_id`),
  KEY `core_playerlog_player_id_ec06282b_fk_core_player_id` (`player_id`),
  CONSTRAINT `core_playerlog_log_id_b28833a6_fk_core_log_id` FOREIGN KEY (`log_id`) REFERENCES `core_log` (`id`),
  CONSTRAINT `core_playerlog_player_id_ec06282b_fk_core_player_id` FOREIGN KEY (`player_id`) REFERENCES `core_player` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_playerlog : ~0 rows (environ)
DELETE FROM `core_playerlog`;
/*!40000 ALTER TABLE `core_playerlog` DISABLE KEYS */;
INSERT INTO `core_playerlog` (`id`, `created_at`, `updated_at`, `log_id`, `player_id`, `role`) VALUES
	(3, '2026-01-20 12:23:12.865202', '2026-01-20 12:23:12.865738', 3, 25, 'TRANSMITTER'),
	(4, '2026-01-20 12:56:24.884203', '2026-01-20 12:56:24.884203', 4, 25, 'TRANSMITTER'),
	(5, '2026-01-20 13:20:03.042857', '2026-01-20 13:20:03.042857', 5, 25, 'TRANSMITTER'),
	(6, '2026-01-20 13:20:03.042857', '2026-01-20 13:20:03.042857', 5, 68, 'RECEIVER'),
	(7, '2026-01-20 13:35:51.016365', '2026-01-20 13:35:51.016365', 6, 25, 'TRANSMITTER'),
	(8, '2026-01-20 13:35:51.016365', '2026-01-20 13:35:51.016365', 6, 68, 'RECEIVER'),
	(9, '2026-01-20 13:36:20.120908', '2026-01-20 13:36:20.120908', 7, 25, 'TRANSMITTER'),
	(10, '2026-01-20 13:36:20.120908', '2026-01-20 13:36:20.120908', 7, 23, 'RECEIVER'),
	(11, '2026-01-20 13:49:00.008511', '2026-01-20 13:49:00.008511', 8, 25, 'TRANSMITTER'),
	(12, '2026-01-20 13:49:00.008511', '2026-01-20 13:49:00.009514', 8, 68, 'RECEIVER'),
	(13, '2026-01-20 13:52:24.971578', '2026-01-20 13:52:24.971578', 9, 25, 'TRANSMITTER'),
	(14, '2026-01-20 13:52:24.971578', '2026-01-20 13:52:24.971578', 9, 68, 'RECEIVER'),
	(15, '2026-01-20 13:54:27.052565', '2026-01-20 13:54:27.053564', 10, 25, 'TRANSMITTER'),
	(16, '2026-01-20 13:54:27.052565', '2026-01-20 13:54:27.053564', 10, 24, 'RECEIVER'),
	(17, '2026-01-20 13:56:13.474974', '2026-01-20 13:56:13.474974', 11, 25, 'TRANSMITTER'),
	(18, '2026-01-20 13:57:16.113446', '2026-01-20 13:57:16.113446', 12, 25, 'TRANSMITTER'),
	(19, '2026-01-20 13:57:16.113446', '2026-01-20 13:57:16.113446', 12, 24, 'RECEIVER'),
	(20, '2026-01-20 14:11:14.283127', '2026-01-20 14:11:14.283127', 13, 25, 'TRANSMITTER'),
	(21, '2026-01-20 14:11:14.283127', '2026-01-20 14:11:14.283127', 13, 24, 'RECEIVER'),
	(22, '2026-01-20 14:13:03.953374', '2026-01-20 14:13:03.954372', 14, 25, 'TRANSMITTER'),
	(23, '2026-01-20 14:13:03.953374', '2026-01-20 14:13:03.954372', 14, 24, 'RECEIVER'),
	(24, '2026-01-20 14:13:17.306149', '2026-01-20 14:13:17.306149', 15, 25, 'TRANSMITTER'),
	(25, '2026-01-20 14:13:17.306149', '2026-01-20 14:13:17.306149', 15, 62, 'RECEIVER'),
	(26, '2026-01-20 14:14:18.688439', '2026-01-20 14:14:18.689439', 16, 25, 'TRANSMITTER'),
	(27, '2026-01-20 14:14:18.688439', '2026-01-20 14:14:18.689439', 16, 24, 'RECEIVER'),
	(28, '2026-01-20 14:14:39.005178', '2026-01-20 14:14:39.005178', 17, 25, 'TRANSMITTER'),
	(29, '2026-01-20 14:14:39.005178', '2026-01-20 14:14:39.005178', 17, 62, 'RECEIVER'),
	(30, '2026-01-20 14:18:15.431612', '2026-01-20 14:18:15.431612', 18, 25, 'TRANSMITTER'),
	(31, '2026-01-20 14:18:15.431612', '2026-01-20 14:18:15.431612', 18, 68, 'RECEIVER'),
	(32, '2026-01-20 14:19:20.808117', '2026-01-20 14:19:20.808117', 19, 25, 'TRANSMITTER'),
	(33, '2026-01-20 14:19:20.808117', '2026-01-20 14:19:20.808117', 19, 68, 'RECEIVER'),
	(34, '2026-01-20 14:21:36.912526', '2026-01-20 14:21:36.913525', 20, 25, 'TRANSMITTER'),
	(35, '2026-01-20 14:21:36.912526', '2026-01-20 14:21:36.913525', 20, 24, 'RECEIVER'),
	(36, '2026-01-20 14:44:34.820672', '2026-01-20 14:44:34.821672', 21, 25, 'TRANSMITTER'),
	(37, '2026-01-20 14:44:34.821672', '2026-01-20 14:44:34.821672', 21, 24, 'RECEIVER'),
	(38, '2026-01-20 14:47:57.377187', '2026-01-20 14:47:57.378239', 22, 25, 'TRANSMITTER'),
	(39, '2026-01-20 14:47:57.377187', '2026-01-20 14:47:57.378239', 22, 23, 'RECEIVER'),
	(40, '2026-01-20 14:48:02.389065', '2026-01-20 14:48:02.389065', 23, 25, 'TRANSMITTER'),
	(41, '2026-01-20 14:48:02.389065', '2026-01-20 14:48:02.389065', 23, 26, 'RECEIVER'),
	(42, '2026-01-20 14:48:15.390657', '2026-01-20 14:48:15.391190', 24, 25, 'TRANSMITTER'),
	(43, '2026-01-20 14:49:05.684377', '2026-01-20 14:49:05.685375', 25, 25, 'TRANSMITTER'),
	(44, '2026-01-21 12:03:11.220590', '2026-01-21 12:03:11.220752', 26, 25, 'TRANSMITTER'),
	(45, '2026-01-21 12:03:25.071304', '2026-01-21 12:03:25.071304', 27, 25, 'TRANSMITTER'),
	(46, '2026-01-21 13:37:04.687276', '2026-01-21 13:37:04.687276', 28, 25, 'TRANSMITTER'),
	(47, '2026-01-21 13:37:04.687276', '2026-01-21 13:37:04.687276', 28, 26, 'RECEIVER'),
	(48, '2026-01-21 13:58:34.511547', '2026-01-21 13:58:34.511547', 29, 22, 'TRANSMITTER'),
	(49, '2026-01-21 13:59:00.601126', '2026-01-21 13:59:00.601126', 30, 25, 'TRANSMITTER'),
	(50, '2026-01-21 13:59:00.601126', '2026-01-21 13:59:00.601126', 30, 22, 'RECEIVER'),
	(51, '2026-01-21 14:52:45.494660', '2026-01-21 14:52:45.494660', 31, 25, 'TRANSMITTER'),
	(52, '2026-01-21 14:53:04.734248', '2026-01-21 14:53:04.734248', 32, 25, 'TRANSMITTER'),
	(53, '2026-01-21 14:53:23.458298', '2026-01-21 14:53:23.458298', 33, 25, 'TRANSMITTER');
/*!40000 ALTER TABLE `core_playerlog` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_playerrecipe
CREATE TABLE IF NOT EXISTS `core_playerrecipe` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `player_id` bigint(20) NOT NULL,
  `recipe_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_playerrecipe_player_id_b583fbe9_fk_core_player_id` (`player_id`),
  KEY `core_playerrecipe_recipe_id_da20d25c_fk_core_recipe_id` (`recipe_id`),
  CONSTRAINT `core_playerrecipe_player_id_b583fbe9_fk_core_player_id` FOREIGN KEY (`player_id`) REFERENCES `core_player` (`id`),
  CONSTRAINT `core_playerrecipe_recipe_id_da20d25c_fk_core_recipe_id` FOREIGN KEY (`recipe_id`) REFERENCES `core_recipe` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_playerrecipe : ~0 rows (environ)
DELETE FROM `core_playerrecipe`;
/*!40000 ALTER TABLE `core_playerrecipe` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_playerrecipe` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_playerresearch
CREATE TABLE IF NOT EXISTS `core_playerresearch` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `player_id` bigint(20) NOT NULL,
  `research_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_playerresearch_player_id_f98076dd_fk_core_player_id` (`player_id`),
  KEY `core_playerresearch_research_id_5fcadcc3_fk_core_research_id` (`research_id`),
  CONSTRAINT `core_playerresearch_player_id_f98076dd_fk_core_player_id` FOREIGN KEY (`player_id`) REFERENCES `core_player` (`id`),
  CONSTRAINT `core_playerresearch_research_id_5fcadcc3_fk_core_research_id` FOREIGN KEY (`research_id`) REFERENCES `core_research` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_playerresearch : ~0 rows (environ)
DELETE FROM `core_playerresearch`;
/*!40000 ALTER TABLE `core_playerresearch` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_playerresearch` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_playerresource
CREATE TABLE IF NOT EXISTS `core_playerresource` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `quantity` int(10) unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `resource_id` bigint(20) DEFAULT NULL,
  `source_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_playerresource_resource_id_12c2f4e3_fk_core_resource_id` (`resource_id`),
  KEY `core_playerresource_source_id_f12bb664_fk_core_player_id` (`source_id`),
  CONSTRAINT `core_playerresource_resource_id_12c2f4e3_fk_core_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `core_resource` (`id`),
  CONSTRAINT `core_playerresource_source_id_f12bb664_fk_core_player_id` FOREIGN KEY (`source_id`) REFERENCES `core_player` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_playerresource : ~0 rows (environ)
DELETE FROM `core_playerresource`;
/*!40000 ALTER TABLE `core_playerresource` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_playerresource` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_playership
CREATE TABLE IF NOT EXISTS `core_playership` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `is_current_ship` tinyint(1) NOT NULL,
  `is_reversed` tinyint(1) NOT NULL,
  `current_hp` smallint(6) NOT NULL,
  `max_hp` smallint(6) NOT NULL,
  `current_movement` smallint(5) unsigned NOT NULL,
  `max_movement` smallint(5) unsigned NOT NULL,
  `current_missile_defense` smallint(6) NOT NULL,
  `current_thermal_defense` smallint(6) NOT NULL,
  `current_ballistic_defense` smallint(6) NOT NULL,
  `current_cargo_size` smallint(6) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `player_id` bigint(20) NOT NULL,
  `ship_id` bigint(20) NOT NULL,
  `max_ballistic_defense` smallint(6) NOT NULL,
  `max_missile_defense` smallint(6) NOT NULL,
  `max_thermal_defense` smallint(6) NOT NULL,
  `view_range` smallint(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_playership_ship_id_f2924a6b_fk_core_ship_id` (`ship_id`),
  KEY `core_playership_player_id_dacd02b5_fk_core_player_id` (`player_id`),
  CONSTRAINT `core_playership_player_id_dacd02b5_fk_core_player_id` FOREIGN KEY (`player_id`) REFERENCES `core_player` (`id`),
  CONSTRAINT `core_playership_ship_id_f2924a6b_fk_core_ship_id` FOREIGN KEY (`ship_id`) REFERENCES `core_ship` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_playership : ~7 rows (environ)
DELETE FROM `core_playership`;
/*!40000 ALTER TABLE `core_playership` DISABLE KEYS */;
INSERT INTO `core_playership` (`id`, `is_current_ship`, `is_reversed`, `current_hp`, `max_hp`, `current_movement`, `max_movement`, `current_missile_defense`, `current_thermal_defense`, `current_ballistic_defense`, `current_cargo_size`, `status`, `created_at`, `updated_at`, `player_id`, `ship_id`, `max_ballistic_defense`, `max_missile_defense`, `max_thermal_defense`, `view_range`) VALUES
	(19, 1, 0, 75, 75, 14, 25, 10, 10, 10, 9, 'FULL', '2025-05-27 09:20:50.808636', '2026-01-21 13:58:31.098900', 22, 2, 10, 10, 10, 6),
	(20, 1, 0, 75, 75, 40, 45, 15, 15, 35, 9, 'FULL', '2025-05-27 12:49:55.358198', '2026-01-18 09:59:36.723626', 23, 3, 35, 15, 15, 6),
	(21, 1, 0, 100, 100, 10, 45, 15, 45, 15, 9, 'FULL', '2025-05-27 12:51:51.679108', '2026-01-13 15:36:05.627318', 24, 1, 15, 15, 45, 6),
	(22, 1, 0, 75, 75, 0, 50, 15, 15, 35, 9, 'FULL', '2025-05-27 12:52:53.070491', '2026-01-18 12:01:58.228765', 25, 8, 35, 15, 15, 6),
	(23, 1, 0, 75, 75, 45, 45, 10, 10, 30, 12, 'FULL', '2025-05-27 12:53:25.790587', '2025-11-27 12:24:29.748822', 26, 2, 30, 10, 10, 6),
	(39, 1, 0, 110, 110, 32, 40, 25, 45, 15, 603, 'FULL', '2025-11-18 13:30:07.712731', '2025-11-18 14:32:57.662640', 61, 5, 15, 25, 45, 6),
	(40, 1, 0, 75, 75, 10, 45, 15, 15, 30, 903, 'FULL', '2025-12-15 08:32:50.391634', '2025-12-19 11:01:49.970476', 62, 2, 30, 15, 15, 6),
	(46, 1, 0, 110, 110, 18, 40, 25, 45, 15, 603, 'FULL', '2026-01-07 16:50:17.673969', '2026-01-08 21:33:10.352728', 68, 5, 15, 25, 45, 6);
/*!40000 ALTER TABLE `core_playership` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_playershipmodule
CREATE TABLE IF NOT EXISTS `core_playershipmodule` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `module_id` bigint(20) NOT NULL,
  `player_ship_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_playershipmodule_module_id_9feab97d_fk_core_module_id` (`module_id`),
  KEY `core_playershipmodul_player_ship_id_500f7065_fk_core_play` (`player_ship_id`),
  CONSTRAINT `core_playershipmodul_player_ship_id_500f7065_fk_core_play` FOREIGN KEY (`player_ship_id`) REFERENCES `core_playership` (`id`),
  CONSTRAINT `core_playershipmodule_module_id_9feab97d_fk_core_module_id` FOREIGN KEY (`module_id`) REFERENCES `core_module` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=246 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_playershipmodule : ~47 rows (environ)
DELETE FROM `core_playershipmodule`;
/*!40000 ALTER TABLE `core_playershipmodule` DISABLE KEYS */;
INSERT INTO `core_playershipmodule` (`id`, `created_at`, `updated_at`, `module_id`, `player_ship_id`) VALUES
	(79, '2025-05-27 09:20:50.824636', '2025-05-27 09:20:50.824636', 1, 19),
	(80, '2025-05-27 09:20:50.839636', '2025-05-27 09:20:50.839636', 50, 19),
	(81, '2025-05-27 09:20:50.890636', '2025-05-27 09:20:50.890636', 93, 19),
	(82, '2025-05-27 09:20:50.905700', '2025-05-27 09:20:50.905700', 30, 19),
	(83, '2025-05-27 09:20:50.952700', '2025-05-27 09:20:50.952700', 24, 19),
	(84, '2025-05-27 09:20:51.015026', '2025-05-27 09:20:51.016026', 36, 19),
	(85, '2025-05-27 12:49:55.376098', '2025-05-27 12:49:55.376621', 2, 20),
	(86, '2025-05-27 12:49:55.391382', '2025-05-27 12:49:55.391382', 64, 20),
	(87, '2025-05-27 12:49:55.408381', '2025-05-27 12:49:55.409381', 30, 20),
	(88, '2025-05-27 12:49:55.457935', '2025-05-27 12:49:55.458935', 23, 20),
	(89, '2025-05-27 12:49:55.474935', '2025-05-27 12:49:55.474935', 36, 20),
	(90, '2025-05-27 12:49:55.490935', '2025-05-27 12:49:55.491935', 58, 20),
	(91, '2025-05-27 12:51:51.691107', '2025-05-27 12:51:51.691107', 10, 21),
	(92, '2025-05-27 12:51:51.742307', '2025-05-27 12:51:51.742307', 23, 21),
	(93, '2025-05-27 12:51:51.758307', '2025-05-27 12:51:51.758307', 37, 21),
	(94, '2025-05-27 12:51:51.775308', '2025-05-27 12:51:51.775308', 30, 21),
	(95, '2025-05-27 12:51:51.824916', '2025-05-27 12:51:51.824916', 92, 21),
	(96, '2025-05-27 12:51:51.841458', '2025-05-27 12:51:51.841458', 44, 21),
	(97, '2025-05-27 12:51:51.857537', '2025-05-27 12:51:51.857537', 56, 21),
	(98, '2025-05-27 12:52:53.083491', '2025-05-27 12:52:53.083491', 2, 22),
	(99, '2025-05-27 12:52:53.100490', '2025-05-27 12:52:53.100490', 23, 22),
	(100, '2025-05-27 12:52:53.117489', '2025-05-27 12:52:53.117489', 36, 22),
	(101, '2025-05-27 12:52:53.141489', '2025-05-27 12:52:53.141489', 31, 22),
	(102, '2025-05-27 12:52:53.158571', '2025-05-27 12:52:53.158571', 92, 22),
	(103, '2025-05-27 12:52:53.208173', '2025-05-27 12:52:53.208173', 78, 22),
	(104, '2025-05-27 12:52:53.225173', '2025-05-27 12:52:53.225173', 108, 22),
	(105, '2025-05-27 12:53:25.803599', '2025-05-27 12:53:25.803599', 2, 23),
	(106, '2025-05-27 12:53:25.853391', '2025-05-27 12:53:25.854424', 50, 23),
	(107, '2025-05-27 12:53:25.904069', '2025-05-27 12:53:25.904069', 93, 23),
	(108, '2025-05-27 12:53:25.920102', '2025-05-27 12:53:25.920102', 30, 23),
	(109, '2025-05-27 12:53:25.936191', '2025-05-27 12:53:25.937191', 24, 23),
	(110, '2025-05-27 12:53:25.953251', '2025-05-27 12:53:25.953251', 36, 23),
	(198, '2025-11-18 13:30:07.762847', '2025-11-18 13:30:07.762847', 9, 39),
	(199, '2025-11-18 13:30:07.785536', '2025-11-18 13:30:07.786536', 23, 39),
	(200, '2025-11-18 13:30:07.817675', '2025-11-18 13:30:07.817675', 37, 39),
	(201, '2025-11-18 13:30:07.842974', '2025-11-18 13:30:07.842974', 101, 39),
	(202, '2025-11-18 13:30:07.860104', '2025-11-18 13:30:07.861105', 30, 39),
	(203, '2025-11-18 13:30:07.875981', '2025-11-18 13:30:07.875981', 78, 39),
	(204, '2025-12-15 08:32:50.410418', '2025-12-15 08:32:50.411419', 2, 40),
	(205, '2025-12-15 08:32:50.433963', '2025-12-15 08:32:50.433963', 50, 40),
	(206, '2025-12-15 08:32:50.450524', '2025-12-15 08:32:50.450524', 93, 40),
	(207, '2025-12-15 08:32:50.474730', '2025-12-15 08:32:50.475730', 30, 40),
	(208, '2025-12-15 08:32:50.491151', '2025-12-15 08:32:50.492149', 24, 40),
	(209, '2025-12-15 08:32:50.508505', '2025-12-15 08:32:50.508505', 36, 40),
	(240, '2026-01-07 16:50:17.689933', '2026-01-07 16:50:17.689933', 9, 46),
	(241, '2026-01-07 16:50:17.702933', '2026-01-07 16:50:17.702933', 23, 46),
	(242, '2026-01-07 16:50:17.720078', '2026-01-07 16:50:17.721077', 37, 46),
	(243, '2026-01-07 16:50:17.744834', '2026-01-07 16:50:17.744834', 101, 46),
	(244, '2026-01-07 16:50:17.795086', '2026-01-07 16:50:17.795086', 30, 46),
	(245, '2026-01-07 16:50:17.811085', '2026-01-07 16:50:17.811085', 78, 46);
/*!40000 ALTER TABLE `core_playershipmodule` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_playershipresource
CREATE TABLE IF NOT EXISTS `core_playershipresource` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `quantity` int(10) unsigned NOT NULL,
  `resource_id` bigint(20) DEFAULT NULL,
  `source_id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_playershipresource_resource_id_3be43e61_fk_core_resource_id` (`resource_id`),
  KEY `core_playershipresource_source_id_d3f7c205_fk_core_playership_id` (`source_id`),
  CONSTRAINT `core_playershipresource_resource_id_3be43e61_fk_core_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `core_resource` (`id`),
  CONSTRAINT `core_playershipresource_source_id_d3f7c205_fk_core_playership_id` FOREIGN KEY (`source_id`) REFERENCES `core_playership` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_playershipresource : ~0 rows (environ)
DELETE FROM `core_playershipresource`;
/*!40000 ALTER TABLE `core_playershipresource` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_playershipresource` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_playerskill
CREATE TABLE IF NOT EXISTS `core_playerskill` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `level` int(10) unsigned NOT NULL,
  `progress` double NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `player_id` bigint(20) NOT NULL,
  `skill_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_playerskill_player_id_6252804c_fk_core_player_id` (`player_id`),
  KEY `core_playerskill_skill_id_690b51b7_fk_core_skill_id` (`skill_id`),
  CONSTRAINT `core_playerskill_player_id_6252804c_fk_core_player_id` FOREIGN KEY (`player_id`) REFERENCES `core_player` (`id`),
  CONSTRAINT `core_playerskill_skill_id_690b51b7_fk_core_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `core_skill` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=622 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_playerskill : ~181 rows (environ)
DELETE FROM `core_playerskill`;
/*!40000 ALTER TABLE `core_playerskill` DISABLE KEYS */;
INSERT INTO `core_playerskill` (`id`, `level`, `progress`, `created_at`, `updated_at`, `player_id`, `skill_id`) VALUES
	(1, 10, 25.2, '2025-05-27 09:20:51.031026', '2025-05-27 09:20:51.031026', 22, 1),
	(2, 0, 0, '2025-05-27 09:20:51.065028', '2025-05-27 09:20:51.066029', 22, 2),
	(3, 0, 0, '2025-05-27 09:20:51.183938', '2025-05-27 09:20:51.184938', 22, 3),
	(4, 0, 0, '2025-05-27 09:20:51.214937', '2025-05-27 09:20:51.215967', 22, 4),
	(5, 0, 0, '2025-05-27 09:20:51.262920', '2025-05-27 09:20:51.263922', 22, 5),
	(6, 0, 0, '2025-05-27 09:20:51.286946', '2025-05-27 09:20:51.288922', 22, 6),
	(7, 0, 0, '2025-05-27 09:20:51.314923', '2025-05-27 09:20:51.315919', 22, 7),
	(8, 0, 0, '2025-05-27 09:20:51.327920', '2025-05-27 09:20:51.327920', 22, 8),
	(9, 0, 0, '2025-05-27 09:20:51.388542', '2025-05-27 09:20:51.388542', 22, 9),
	(10, 0, 0, '2025-05-27 09:20:51.403545', '2025-05-27 09:20:51.403545', 22, 10),
	(11, 10, 47.5, '2025-05-27 09:20:51.422544', '2025-05-27 09:20:51.422544', 22, 11),
	(12, 0, 0, '2025-05-27 09:20:51.436065', '2025-05-27 09:20:51.436065', 22, 12),
	(13, 0, 0, '2025-05-27 09:20:51.454856', '2025-05-27 09:20:51.455858', 22, 13),
	(14, 0, 0, '2025-05-27 09:20:51.468857', '2025-05-27 09:20:51.468857', 22, 14),
	(15, 0, 0, '2025-05-27 09:20:51.486856', '2025-05-27 09:20:51.487856', 22, 15),
	(16, 0, 0, '2025-05-27 09:20:51.501856', '2025-05-27 09:20:51.501856', 22, 16),
	(17, 0, 0, '2025-05-27 09:20:51.520859', '2025-05-27 09:20:51.520859', 22, 17),
	(18, 10, 11, '2025-05-27 09:20:51.534856', '2025-05-27 09:20:51.534856', 22, 18),
	(19, 10, 0, '2025-05-27 09:20:51.553856', '2025-05-27 09:20:51.553856', 22, 19),
	(20, 0, 0, '2025-05-27 09:20:51.569857', '2025-05-27 09:20:51.569857', 22, 20),
	(21, 0, 0, '2025-05-27 09:20:51.619856', '2025-05-27 09:20:51.619856', 22, 21),
	(22, 0, 0, '2025-05-27 09:20:51.633857', '2025-05-27 09:20:51.634857', 22, 22),
	(23, 0, 0, '2025-05-27 09:20:51.652856', '2025-05-27 09:20:51.653858', 22, 23),
	(24, 10, 33.87, '2025-05-27 12:49:55.509547', '2025-05-27 12:49:55.510067', 23, 1),
	(25, 0, 0, '2025-05-27 12:49:55.523067', '2025-05-27 12:49:55.524066', 23, 2),
	(26, 0, 0, '2025-05-27 12:49:55.541212', '2025-05-27 12:49:55.541212', 23, 3),
	(27, 0, 0, '2025-05-27 12:49:55.566033', '2025-05-27 12:49:55.566033', 23, 4),
	(28, 0, 0, '2025-05-27 12:49:55.583031', '2025-05-27 12:49:55.583031', 23, 5),
	(29, 0, 0, '2025-05-27 12:49:55.649093', '2025-05-27 12:49:55.649093', 23, 6),
	(30, 0, 0, '2025-05-27 12:49:55.666092', '2025-05-27 12:49:55.666092', 23, 7),
	(31, 0, 0, '2025-05-27 12:49:55.681064', '2025-05-27 12:49:55.681064', 23, 8),
	(32, 0, 0, '2025-05-27 12:49:55.727044', '2025-05-27 12:49:55.727044', 23, 9),
	(33, 0, 0, '2025-05-27 12:49:55.756044', '2025-05-27 12:49:55.757043', 23, 10),
	(34, 0, 0, '2025-05-27 12:49:55.773046', '2025-05-27 12:49:55.774043', 23, 11),
	(35, 0, 0, '2025-05-27 12:49:55.789044', '2025-05-27 12:49:55.789044', 23, 12),
	(36, 10, 12.5, '2025-05-27 12:49:55.806568', '2025-05-27 12:49:55.806568', 23, 13),
	(37, 0, 0, '2025-05-27 12:49:55.822046', '2025-05-27 12:49:55.822046', 23, 14),
	(38, 0, 0, '2025-05-27 12:49:55.839046', '2025-05-27 12:49:55.840048', 23, 15),
	(39, 0, 0, '2025-05-27 12:49:55.856048', '2025-05-27 12:49:55.856048', 23, 16),
	(40, 0, 0, '2025-05-27 12:49:55.873047', '2025-05-27 12:49:55.873047', 23, 17),
	(41, 0, 0, '2025-05-27 12:49:55.889048', '2025-05-27 12:49:55.889048', 23, 18),
	(42, 0, 0, '2025-05-27 12:49:55.906049', '2025-05-27 12:49:55.906049', 23, 19),
	(43, 10, 5, '2025-05-27 12:49:55.922050', '2025-05-27 12:49:55.922050', 23, 20),
	(44, 10, 98, '2025-05-27 12:49:55.939051', '2025-05-27 12:49:55.939051', 23, 21),
	(45, 0, 0, '2025-05-27 12:49:55.955050', '2025-05-27 12:49:55.955050', 23, 22),
	(46, 0, 0, '2025-05-27 12:49:55.972051', '2025-05-27 12:49:55.972051', 23, 23),
	(47, 10, 0, '2025-05-27 12:51:51.876539', '2025-05-27 12:51:51.876539', 24, 1),
	(48, 0, 0, '2025-05-27 12:51:51.890537', '2025-05-27 12:51:51.890537', 24, 2),
	(49, 0, 0, '2025-05-27 12:51:51.908160', '2025-05-27 12:51:51.908160', 24, 3),
	(50, 0, 0, '2025-05-27 12:51:51.924162', '2025-05-27 12:51:51.924162', 24, 4),
	(51, 0, 0, '2025-05-27 12:51:51.941160', '2025-05-27 12:51:51.941160', 24, 5),
	(52, 10, 0, '2025-05-27 12:51:51.957159', '2025-05-27 12:51:51.957159', 24, 6),
	(53, 0, 0, '2025-05-27 12:51:51.974159', '2025-05-27 12:51:51.974159', 24, 7),
	(54, 0, 0, '2025-05-27 12:51:51.990160', '2025-05-27 12:51:51.990160', 24, 8),
	(55, 0, 0, '2025-05-27 12:51:52.007159', '2025-05-27 12:51:52.007159', 24, 9),
	(56, 0, 0, '2025-05-27 12:51:52.023713', '2025-05-27 12:51:52.023713', 24, 10),
	(57, 0, 0, '2025-05-27 12:51:52.040713', '2025-05-27 12:51:52.040713', 24, 11),
	(58, 0, 0, '2025-05-27 12:51:52.056713', '2025-05-27 12:51:52.056713', 24, 12),
	(59, 0, 0, '2025-05-27 12:51:52.073713', '2025-05-27 12:51:52.073713', 24, 13),
	(60, 10, 0, '2025-05-27 12:51:52.089713', '2025-05-27 12:51:52.089713', 24, 14),
	(61, 0, 0, '2025-05-27 12:51:52.107229', '2025-05-27 12:51:52.107229', 24, 15),
	(62, 0, 0, '2025-05-27 12:51:52.123229', '2025-05-27 12:51:52.123229', 24, 16),
	(63, 0, 0, '2025-05-27 12:51:52.140229', '2025-05-27 12:51:52.140229', 24, 17),
	(64, 10, 0, '2025-05-27 12:51:52.156229', '2025-05-27 12:51:52.156229', 24, 18),
	(65, 0, 0, '2025-05-27 12:51:52.181229', '2025-05-27 12:51:52.181229', 24, 19),
	(66, 0, 0, '2025-05-27 12:51:52.197229', '2025-05-27 12:51:52.198231', 24, 20),
	(67, 0, 0, '2025-05-27 12:51:52.222355', '2025-05-27 12:51:52.223354', 24, 21),
	(68, 0, 0, '2025-05-27 12:51:52.239023', '2025-05-27 12:51:52.239548', 24, 22),
	(69, 0, 0, '2025-05-27 12:51:52.263623', '2025-05-27 12:51:52.264623', 24, 23),
	(70, 10, 0, '2025-05-27 12:52:53.242290', '2025-05-27 12:52:53.242290', 25, 1),
	(71, 0, 0, '2025-05-27 12:52:53.257290', '2025-05-27 12:52:53.257290', 25, 2),
	(72, 0, 0, '2025-05-27 12:52:53.273972', '2025-05-27 12:52:53.273972', 25, 3),
	(73, 0, 0, '2025-05-27 12:52:53.290972', '2025-05-27 12:52:53.290972', 25, 4),
	(74, 0, 0, '2025-05-27 12:52:53.306971', '2025-05-27 12:52:53.307971', 25, 5),
	(75, 0, 0, '2025-05-27 12:52:53.323972', '2025-05-27 12:52:53.324971', 25, 6),
	(76, 0, 0, '2025-05-27 12:52:53.339971', '2025-05-27 12:52:53.340971', 25, 7),
	(77, 10, 0, '2025-05-27 12:52:53.356971', '2025-05-27 12:52:53.357971', 25, 8),
	(78, 0, 0, '2025-05-27 12:52:53.381702', '2025-05-27 12:52:53.381702', 25, 9),
	(79, 0, 0, '2025-05-27 12:52:53.398702', '2025-05-27 12:52:53.398702', 25, 10),
	(80, 0, 0, '2025-05-27 12:52:53.447702', '2025-05-27 12:52:53.448702', 25, 11),
	(81, 0, 0, '2025-05-27 12:52:53.464702', '2025-05-27 12:52:53.465702', 25, 12),
	(82, 0, 0, '2025-05-27 12:52:53.481295', '2025-05-27 12:52:53.481295', 25, 13),
	(83, 0, 0, '2025-05-27 12:52:53.498643', '2025-05-27 12:52:53.498643', 25, 14),
	(84, 0, 0, '2025-05-27 12:52:53.514781', '2025-05-27 12:52:53.514781', 25, 15),
	(85, 10, 0, '2025-05-27 12:52:53.531062', '2025-05-27 12:52:53.532061', 25, 16),
	(86, 0, 0, '2025-05-27 12:52:53.548099', '2025-05-27 12:52:53.548244', 25, 17),
	(87, 0, 0, '2025-05-27 12:52:53.572617', '2025-05-27 12:52:53.573617', 25, 18),
	(88, 0, 0, '2025-05-27 12:52:53.589071', '2025-05-27 12:52:53.589071', 25, 19),
	(89, 0, 0, '2025-05-27 12:52:53.606148', '2025-05-27 12:52:53.606148', 25, 20),
	(90, 0, 0, '2025-05-27 12:52:53.622446', '2025-05-27 12:52:53.622446', 25, 21),
	(91, 0, 0, '2025-05-27 12:52:53.638806', '2025-05-27 12:52:53.639806', 25, 22),
	(92, 0, 0, '2025-05-27 12:52:53.654958', '2025-05-27 12:52:53.655959', 25, 23),
	(93, 10, 0, '2025-05-27 12:53:25.971252', '2025-05-27 12:53:25.971252', 26, 1),
	(94, 0, 0, '2025-05-27 12:53:25.986251', '2025-05-27 12:53:25.986251', 26, 2),
	(95, 0, 0, '2025-05-27 12:53:26.003323', '2025-05-27 12:53:26.003323', 26, 3),
	(96, 0, 0, '2025-05-27 12:53:26.019323', '2025-05-27 12:53:26.019323', 26, 4),
	(97, 0, 0, '2025-05-27 12:53:26.036323', '2025-05-27 12:53:26.036323', 26, 5),
	(98, 0, 0, '2025-05-27 12:53:26.051915', '2025-05-27 12:53:26.052914', 26, 6),
	(99, 0, 0, '2025-05-27 12:53:26.068928', '2025-05-27 12:53:26.069929', 26, 7),
	(100, 0, 0, '2025-05-27 12:53:26.084930', '2025-05-27 12:53:26.085929', 26, 8),
	(101, 0, 0, '2025-05-27 12:53:26.102008', '2025-05-27 12:53:26.103007', 26, 9),
	(102, 0, 0, '2025-05-27 12:53:26.119008', '2025-05-27 12:53:26.119008', 26, 10),
	(103, 10, 0, '2025-05-27 12:53:26.135007', '2025-05-27 12:53:26.136007', 26, 11),
	(104, 0, 0, '2025-05-27 12:53:26.151079', '2025-05-27 12:53:26.152473', 26, 12),
	(105, 0, 0, '2025-05-27 12:53:26.168987', '2025-05-27 12:53:26.168987', 26, 13),
	(106, 0, 0, '2025-05-27 12:53:26.184988', '2025-05-27 12:53:26.184988', 26, 14),
	(107, 0, 0, '2025-05-27 12:53:26.201988', '2025-05-27 12:53:26.201988', 26, 15),
	(108, 0, 0, '2025-05-27 12:53:26.260111', '2025-05-27 12:53:26.260111', 26, 16),
	(109, 0, 0, '2025-05-27 12:53:26.284148', '2025-05-27 12:53:26.285148', 26, 17),
	(110, 10, 0, '2025-05-27 12:53:26.301146', '2025-05-27 12:53:26.301146', 26, 18),
	(111, 10, 0, '2025-05-27 12:53:26.318146', '2025-05-27 12:53:26.318146', 26, 19),
	(112, 0, 0, '2025-05-27 12:53:26.334147', '2025-05-27 12:53:26.334147', 26, 20),
	(113, 0, 0, '2025-05-27 12:53:26.350709', '2025-05-27 12:53:26.350709', 26, 21),
	(114, 0, 0, '2025-05-27 12:53:26.366709', '2025-05-27 12:53:26.366709', 26, 22),
	(115, 0, 0, '2025-05-27 12:53:26.383710', '2025-05-27 12:53:26.383710', 26, 23),
	(438, 0, 0, '2025-11-18 13:30:07.894979', '2025-11-18 13:30:07.894979', 61, 1),
	(439, 10, 0, '2025-11-18 13:30:07.927214', '2025-11-18 13:30:07.927214', 61, 2),
	(440, 0, 0, '2025-11-18 13:30:07.958310', '2025-11-18 13:30:07.958310', 61, 3),
	(441, 0, 0, '2025-11-18 13:30:07.992772', '2025-11-18 13:30:07.993770', 61, 4),
	(442, 10, 0, '2025-11-18 13:30:08.007897', '2025-11-18 13:30:08.007897', 61, 5),
	(443, 0, 0, '2025-11-18 13:30:08.026040', '2025-11-18 13:30:08.026040', 61, 6),
	(444, 0, 0, '2025-11-18 13:30:08.041166', '2025-11-18 13:30:08.041412', 61, 7),
	(445, 0, 0, '2025-11-18 13:30:08.059129', '2025-11-18 13:30:08.059129', 61, 8),
	(446, 0, 0, '2025-11-18 13:30:08.074129', '2025-11-18 13:30:08.074129', 61, 9),
	(447, 10, 0, '2025-11-18 13:30:08.125354', '2025-11-18 13:30:08.126353', 61, 10),
	(448, 0, 0, '2025-11-18 13:30:08.140354', '2025-11-18 13:30:08.140354', 61, 11),
	(449, 0, 0, '2025-11-18 13:30:08.158702', '2025-11-18 13:30:08.158702', 61, 12),
	(450, 0, 0, '2025-11-18 13:30:08.173126', '2025-11-18 13:30:08.174127', 61, 13),
	(451, 0, 0, '2025-11-18 13:30:08.191998', '2025-11-18 13:30:08.191998', 61, 14),
	(452, 0, 0, '2025-11-18 13:30:08.206126', '2025-11-18 13:30:08.207129', 61, 15),
	(453, 0, 0, '2025-11-18 13:30:08.258337', '2025-11-18 13:30:08.258337', 61, 16),
	(454, 10, 0, '2025-11-18 13:30:08.289336', '2025-11-18 13:30:08.289336', 61, 17),
	(455, 0, 0, '2025-11-18 13:30:08.307638', '2025-11-18 13:30:08.308638', 61, 18),
	(456, 0, 0, '2025-11-18 13:30:08.322960', '2025-11-18 13:30:08.323356', 61, 19),
	(457, 0, 0, '2025-11-18 13:30:08.340715', '2025-11-18 13:30:08.341638', 61, 20),
	(458, 0, 0, '2025-11-18 13:30:08.424848', '2025-11-18 13:30:08.424848', 61, 21),
	(459, 0, 0, '2025-11-18 13:30:08.497477', '2025-11-18 13:30:08.498478', 61, 22),
	(460, 0, 0, '2025-11-18 13:30:08.539228', '2025-11-18 13:30:08.540225', 61, 23),
	(461, 10, 0, '2025-12-15 08:32:50.526502', '2025-12-15 08:32:50.526502', 62, 1),
	(462, 0, 0, '2025-12-15 08:32:50.549340', '2025-12-15 08:32:50.550341', 62, 2),
	(463, 0, 0, '2025-12-15 08:32:50.566430', '2025-12-15 08:32:50.566430', 62, 3),
	(464, 0, 0, '2025-12-15 08:32:50.582430', '2025-12-15 08:32:50.582430', 62, 4),
	(465, 0, 0, '2025-12-15 08:32:50.599432', '2025-12-15 08:32:50.599432', 62, 5),
	(466, 0, 0, '2025-12-15 08:32:50.615772', '2025-12-15 08:32:50.615772', 62, 6),
	(467, 0, 0, '2025-12-15 08:32:50.632486', '2025-12-15 08:32:50.632486', 62, 7),
	(468, 0, 0, '2025-12-15 08:32:50.648497', '2025-12-15 08:32:50.649497', 62, 8),
	(469, 0, 0, '2025-12-15 08:32:50.665695', '2025-12-15 08:32:50.665695', 62, 9),
	(470, 0, 0, '2025-12-15 08:32:50.681695', '2025-12-15 08:32:50.681695', 62, 10),
	(471, 10, 0, '2025-12-15 08:32:50.698747', '2025-12-15 08:32:50.698747', 62, 11),
	(472, 0, 0, '2025-12-15 08:32:50.714747', '2025-12-15 08:32:50.715747', 62, 12),
	(473, 0, 0, '2025-12-15 08:32:50.731855', '2025-12-15 08:32:50.731855', 62, 13),
	(474, 0, 0, '2025-12-15 08:32:50.748043', '2025-12-15 08:32:50.748043', 62, 14),
	(475, 0, 0, '2025-12-15 08:32:50.764306', '2025-12-15 08:32:50.765306', 62, 15),
	(476, 0, 0, '2025-12-15 08:32:50.781310', '2025-12-15 08:32:50.781310', 62, 16),
	(477, 0, 0, '2025-12-15 08:32:50.798453', '2025-12-15 08:32:50.798453', 62, 17),
	(478, 10, 0, '2025-12-15 08:32:50.814264', '2025-12-15 08:32:50.814264', 62, 18),
	(479, 10, 0, '2025-12-15 08:32:50.831373', '2025-12-15 08:32:50.831373', 62, 19),
	(480, 0, 0, '2025-12-15 08:32:50.847564', '2025-12-15 08:32:50.847564', 62, 20),
	(481, 0, 0, '2025-12-15 08:32:50.864255', '2025-12-15 08:32:50.864255', 62, 21),
	(482, 0, 0, '2025-12-15 08:32:50.880469', '2025-12-15 08:32:50.880469', 62, 22),
	(483, 0, 0, '2025-12-15 08:32:50.897521', '2025-12-15 08:32:50.897521', 62, 23),
	(599, 0, 0, '2026-01-07 16:50:17.829085', '2026-01-07 16:50:17.829085', 68, 1),
	(600, 10, 0, '2026-01-07 16:50:17.844084', '2026-01-07 16:50:17.844084', 68, 2),
	(601, 0, 0, '2026-01-07 16:50:17.861084', '2026-01-07 16:50:17.861084', 68, 3),
	(602, 0, 0, '2026-01-07 16:50:17.877047', '2026-01-07 16:50:17.878046', 68, 4),
	(603, 10, 0, '2026-01-07 16:50:17.903372', '2026-01-07 16:50:17.903372', 68, 5),
	(604, 0, 0, '2026-01-07 16:50:17.918521', '2026-01-07 16:50:17.918521', 68, 6),
	(605, 0, 0, '2026-01-07 16:50:17.935519', '2026-01-07 16:50:17.936521', 68, 7),
	(606, 0, 0, '2026-01-07 16:50:17.950899', '2026-01-07 16:50:17.951902', 68, 8),
	(607, 0, 0, '2026-01-07 16:50:17.969259', '2026-01-07 16:50:17.969259', 68, 9),
	(608, 10, 0, '2026-01-07 16:50:17.984257', '2026-01-07 16:50:17.985259', 68, 10),
	(609, 0, 0, '2026-01-07 16:50:18.002116', '2026-01-07 16:50:18.002116', 68, 11),
	(610, 0, 0, '2026-01-07 16:50:18.018219', '2026-01-07 16:50:18.018219', 68, 12),
	(611, 0, 0, '2026-01-07 16:50:18.035218', '2026-01-07 16:50:18.035218', 68, 13),
	(612, 0, 0, '2026-01-07 16:50:18.050985', '2026-01-07 16:50:18.051987', 68, 14),
	(613, 0, 0, '2026-01-07 16:50:18.068176', '2026-01-07 16:50:18.068176', 68, 15),
	(614, 0, 0, '2026-01-07 16:50:18.084176', '2026-01-07 16:50:18.084176', 68, 16),
	(615, 10, 0, '2026-01-07 16:50:18.101127', '2026-01-07 16:50:18.101127', 68, 17),
	(616, 0, 0, '2026-01-07 16:50:18.117801', '2026-01-07 16:50:18.117801', 68, 18),
	(617, 0, 0, '2026-01-07 16:50:18.131610', '2026-01-07 16:50:18.131610', 68, 19),
	(618, 0, 0, '2026-01-07 16:50:18.201089', '2026-01-07 16:50:18.201089', 68, 20),
	(619, 0, 0, '2026-01-07 16:50:18.233387', '2026-01-07 16:50:18.233387', 68, 21),
	(620, 0, 0, '2026-01-07 16:50:18.300395', '2026-01-07 16:50:18.300395', 68, 22),
	(621, 0, 0, '2026-01-07 16:50:18.316488', '2026-01-07 16:50:18.316488', 68, 23);
/*!40000 ALTER TABLE `core_playerskill` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_privatemessage
CREATE TABLE IF NOT EXISTS `core_privatemessage` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `subject` varchar(120) NOT NULL,
  `body` longtext NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `sender_id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `priority` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_privatemessage_sender_id_d68aaf53_fk_core_player_id` (`sender_id`),
  KEY `core_privat_priorit_72130a_idx` (`priority`,`timestamp`),
  KEY `core_privat_timesta_7014d7_idx` (`timestamp`),
  CONSTRAINT `core_privatemessage_sender_id_d68aaf53_fk_core_player_id` FOREIGN KEY (`sender_id`) REFERENCES `core_player` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_privatemessage : ~81 rows (environ)
DELETE FROM `core_privatemessage`;
/*!40000 ALTER TABLE `core_privatemessage` DISABLE KEYS */;
INSERT INTO `core_privatemessage` (`id`, `subject`, `body`, `timestamp`, `sender_id`, `created_at`, `deleted_at`, `updated_at`, `priority`) VALUES
	(16, 'Test', 'sqdsdqdqsd', '2025-10-28 14:39:31.685005', 24, '2025-10-28 14:39:31.685005', '2025-11-10 10:46:17.922663', '2025-10-28 14:39:31.687008', 'LOW'),
	(17, 'Un message de Mumu !!!!!', 'JE SUIS UN MESSAGE DE TEST ! OKAY?!', '2025-10-28 14:49:19.273901', 24, '2025-10-28 14:49:19.273365', NULL, '2025-10-28 14:49:19.356823', 'LOW'),
	(18, 'RE: Un message de Mumu !!!!!', 'OUAI OK OUAI !!!!!! J\'AI COMPRIS !!!!!', '2025-10-28 14:50:05.635274', 23, '2025-10-28 14:50:05.635274', '2025-10-28 15:51:08.607245', '2025-10-28 14:50:05.635789', 'LOW'),
	(19, 'Test msg', 'qsdqdq', '2025-10-29 08:06:46.902178', 23, '2025-10-29 08:06:46.902178', NULL, '2025-10-29 08:06:46.903777', 'LOW'),
	(20, 'qsdqds', 'qsdqsdqsd', '2025-10-29 08:16:57.625675', 23, '2025-10-29 08:16:57.625675', NULL, '2025-10-29 08:16:57.625675', 'LOW'),
	(21, 'tsqdqsd', 'qsqsdqsdsd', '2025-10-29 08:24:47.531097', 23, '2025-10-29 08:24:47.531097', NULL, '2025-10-29 08:24:47.531097', 'LOW'),
	(22, 'qsdqsdqd', 'sqddsq', '2025-10-29 08:27:39.329740', 23, '2025-10-29 08:27:39.328740', NULL, '2025-10-29 08:27:39.329740', 'LOW'),
	(23, 'qsdsqdqsd', 'qsdqdq', '2025-10-29 08:28:02.096259', 23, '2025-10-29 08:28:02.096259', NULL, '2025-10-29 08:28:02.097258', 'LOW'),
	(24, 'qsdsqdq', 'dsdqdsqdqsdqd', '2025-10-29 11:26:52.960005', 23, '2025-10-29 11:26:52.959468', NULL, '2025-10-29 11:26:52.985488', 'LOW'),
	(25, 'RE: Test', 'qsdqsdqdq', '2025-10-29 12:39:36.188578', 23, '2025-10-29 12:39:36.188052', NULL, '2025-10-29 12:39:36.188578', 'LOW'),
	(26, 'ENCORE UN AUTRE TEST LA', 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?', '2025-10-29 15:24:59.885651', 23, '2025-10-29 15:24:59.884650', NULL, '2025-10-29 15:24:59.888650', 'LOW'),
	(27, 'ENCORE UN AUTRE TEST LA', 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?', '2025-10-29 15:24:59.998288', 23, '2025-10-29 15:24:59.997758', NULL, '2025-10-29 15:24:59.998288', 'LOW'),
	(28, 'Test ENCORE UN TEST LAAAA', 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?', '2025-10-29 15:30:22.232598', 24, '2025-10-29 15:30:22.231601', NULL, '2025-10-29 15:30:22.232598', 'LOW'),
	(29, 'RE: Test ENCORE UN TEST LAAAA', 'prout.', '2025-10-29 15:30:42.541963', 23, '2025-10-29 15:30:42.541427', NULL, '2025-10-29 15:30:42.541963', 'LOW'),
	(30, 'test msg faction', 'qdsqdsqdqd', '2025-11-01 11:45:21.034657', 23, '2025-11-01 11:45:21.034657', NULL, '2025-11-01 11:45:21.054767', 'LOW'),
	(31, 'test msg faction', 'qsdqdsqsdq', '2025-11-01 11:46:23.756160', 23, '2025-11-01 11:46:23.755606', NULL, '2025-11-01 11:46:23.758376', 'LOW'),
	(32, 'test msg faction 222', 'qdqdsdqdsqdqdsqdqd', '2025-11-01 11:47:03.768309', 23, '2025-11-01 11:47:03.768309', NULL, '2025-11-01 11:47:03.771309', 'LOW'),
	(33, 'test msg faction 33333333', 'qsdqsdsdqdsd', '2025-11-01 11:47:38.030070', 23, '2025-11-01 11:47:38.029528', NULL, '2025-11-01 11:47:38.032738', 'LOW'),
	(34, 'qsdqdqsdqd', 'qdsqdqdqsd', '2025-11-01 12:59:22.106385', 23, '2025-11-01 12:59:22.106385', NULL, '2025-11-01 12:59:22.109725', 'LOW'),
	(35, 'Test msg 2321323131231', 'qsdqsdqsdsqdqsdsqdq', '2025-11-01 13:06:18.443511', 23, '2025-11-01 13:06:18.443485', NULL, '2025-11-01 13:06:18.445672', 'LOW'),
	(36, 'qsdqsdqdqsdqdqd', 'sqdqdqsdqsd', '2025-11-01 13:07:45.672979', 23, '2025-11-01 13:07:45.672979', NULL, '2025-11-01 13:07:45.674560', 'LOW'),
	(37, 'wesh', 'qsdqsdqdqddqds', '2025-11-01 13:09:28.004956', 24, '2025-11-01 13:09:28.004406', NULL, '2025-11-01 13:09:28.004956', 'LOW'),
	(38, 'qsdqsdsqdqffdvvvvvv', 'qsdqsqsdqsdqsdsdqd', '2025-11-01 13:10:45.063685', 23, '2025-11-01 13:10:45.063685', NULL, '2025-11-01 13:10:45.063685', 'LOW'),
	(39, 'qsdqsdqsd', 'qsdqsdqdsqsdqsdqsdqdqsdqdq', '2025-11-01 13:11:51.408997', 23, '2025-11-01 13:11:51.408997', NULL, '2025-11-01 13:11:51.408997', 'LOW'),
	(40, 'qsdsdqkngnnvndncvdn', 'qsdqsdqsdqsdqsd', '2025-11-01 13:12:45.571433', 23, '2025-11-01 13:12:45.571433', NULL, '2025-11-01 13:12:45.571433', 'LOW'),
	(41, 'qsdqsd', 'fffffff', '2025-11-01 13:13:49.108718', 24, '2025-11-01 13:13:49.108718', NULL, '2025-11-01 13:13:49.108718', 'LOW'),
	(42, 'qsdvvvvv', 'vvv', '2025-11-01 13:15:09.282704', 24, '2025-11-01 13:15:09.282704', NULL, '2025-11-01 13:15:09.284704', 'LOW'),
	(43, 'vxxxqxw', 'qsdqsdqsd', '2025-11-01 13:16:09.541586', 24, '2025-11-01 13:16:09.541573', NULL, '2025-11-01 13:16:09.543185', 'LOW'),
	(44, 'qsdqsdqs', 'qsdqdsdq', '2025-11-01 13:21:02.965790', 23, '2025-11-01 13:21:02.965790', NULL, '2025-11-01 13:21:02.992313', 'LOW'),
	(45, 'vcvxvcvxcvc', 'vxcvxvvc', '2025-11-01 13:24:25.278472', 23, '2025-11-01 13:24:25.278472', NULL, '2025-11-01 13:24:25.280080', 'LOW'),
	(46, 'qsdqsd', 'fcvcvxcvxvcv', '2025-11-01 13:26:48.303892', 23, '2025-11-01 13:26:48.303892', NULL, '2025-11-01 13:26:48.303892', 'LOW'),
	(47, 'sdqsdqsdsqd', 'qsdqsdqsdqsd', '2025-11-01 13:40:33.655387', 23, '2025-11-01 13:40:33.654843', NULL, '2025-11-01 13:40:33.659178', 'LOW'),
	(48, 'fdbvbbvbvbv', 'vvbvbvbvvbb', '2025-11-01 13:50:00.381603', 23, '2025-11-01 13:50:00.381603', NULL, '2025-11-01 13:50:00.383602', 'LOW'),
	(49, 'test notif', 'qdqsdqsdsqdqds', '2025-11-01 14:36:18.349474', 24, '2025-11-01 14:36:18.348473', NULL, '2025-11-01 14:36:18.350473', 'LOW'),
	(50, 'qsdqsdq', 'qsdqddq', '2025-11-01 14:36:42.839438', 24, '2025-11-01 14:36:42.839438', NULL, '2025-11-01 14:36:42.839438', 'LOW'),
	(51, 'qsdq', 'dqdqd', '2025-11-01 14:41:00.782324', 24, '2025-11-01 14:41:00.781774', NULL, '2025-11-01 14:41:00.782324', 'LOW'),
	(52, 'test123', 'qsdqsddqsd', '2025-11-01 14:43:44.144514', 24, '2025-11-01 14:43:44.144514', NULL, '2025-11-01 14:43:44.144514', 'LOW'),
	(53, 'xxxcxvvxcv', 'xcxcvxvxcv', '2025-11-01 14:48:54.682119', 24, '2025-11-01 14:48:54.682119', NULL, '2025-11-01 14:48:54.682119', 'LOW'),
	(54, 'qsdqsd', 'qdqsdqdsd', '2025-11-01 15:03:04.626539', 24, '2025-11-01 15:03:04.626539', NULL, '2025-11-01 15:03:04.626539', 'LOW'),
	(55, 'qsdqsd', 'dqsdqsd', '2025-11-01 15:05:37.908949', 24, '2025-11-01 15:05:37.908949', NULL, '2025-11-01 15:05:37.908949', 'LOW'),
	(56, 'qsdqsd', 'qdqsdqsdqd', '2025-11-01 15:06:32.743089', 23, '2025-11-01 15:06:32.742544', NULL, '2025-11-01 15:06:32.743089', 'LOW'),
	(57, 'RE: qsdqsd', 'qsdsdqdqsdqd', '2025-11-01 15:19:07.050459', 24, '2025-11-01 15:19:07.050459', NULL, '2025-11-01 15:19:07.050459', 'LOW'),
	(58, 'RE: qsdqsd', 'qsdgfffff', '2025-11-01 15:19:57.997025', 24, '2025-11-01 15:19:57.997025', NULL, '2025-11-01 15:19:57.997025', 'LOW'),
	(59, 'RE: qsdqsd', 'qsdqsdqdd', '2025-11-01 15:20:17.716235', 24, '2025-11-01 15:20:17.716235', NULL, '2025-11-01 15:20:17.716235', 'LOW'),
	(60, 'Test notif', 'test notif !', '2025-11-01 15:24:20.591288', 24, '2025-11-01 15:24:20.590288', NULL, '2025-11-01 15:24:20.593287', 'LOW'),
	(61, 'RE: Test notif', 'réponse test notif avec fenetre déjà ouverte.', '2025-11-01 15:24:42.360084', 23, '2025-11-01 15:24:42.359083', NULL, '2025-11-01 15:24:42.360084', 'LOW'),
	(62, 'Autre test', 'qsdqsdqsdqsd', '2025-11-01 15:25:26.613894', 23, '2025-11-01 15:25:26.613894', NULL, '2025-11-01 15:25:26.614424', 'LOW'),
	(63, 'test', 'qsdqsdqsdqdqsd', '2025-11-10 07:42:12.075943', 23, '2025-11-10 07:42:12.075402', NULL, '2025-11-10 07:42:12.077523', 'LOW'),
	(64, 'qsdqds', 'qsdqds', '2025-11-10 07:55:14.195164', 25, '2025-11-10 07:55:14.195164', NULL, '2025-11-10 07:55:14.195164', 'LOW'),
	(65, 'qsdqd', 'qsdqsdd', '2025-11-10 08:45:46.894250', 25, '2025-11-10 08:45:46.893742', NULL, '2025-11-10 08:45:46.894274', 'LOW'),
	(66, 'qsdqsd', 'qdqds', '2025-11-10 08:53:35.742905', 25, '2025-11-10 08:53:35.742905', NULL, '2025-11-10 08:53:35.742905', 'LOW'),
	(67, 'qsdq', 'dqsdqd', '2025-11-10 09:35:32.271600', 25, '2025-11-10 09:35:32.271600', NULL, '2025-11-10 09:35:32.271600', 'LOW'),
	(68, 'qsdqd', 'sqdqd', '2025-11-10 09:36:17.824438', 25, '2025-11-10 09:36:17.824438', NULL, '2025-11-10 09:36:17.824438', 'LOW'),
	(69, 'qsdsd', 'qdsd', '2025-11-10 09:36:28.401371', 25, '2025-11-10 09:36:28.401371', NULL, '2025-11-10 09:36:28.401371', 'LOW'),
	(70, 'qsdq', 'dsqdd', '2025-11-10 09:38:13.850104', 25, '2025-11-10 09:38:13.850104', NULL, '2025-11-10 09:38:13.850104', 'LOW'),
	(71, 'qsdq', 'sdqsdq', '2025-11-10 09:40:43.596043', 25, '2025-11-10 09:40:43.596043', NULL, '2025-11-10 09:40:43.596043', 'LOW'),
	(72, 'qdsqdqds', 'qdqdsqd', '2025-11-10 09:41:28.939703', 25, '2025-11-10 09:41:28.938954', NULL, '2025-11-10 09:41:28.939703', 'LOW'),
	(73, 'qsdqsd', 'dssddd', '2025-11-10 09:46:41.362619', 25, '2025-11-10 09:46:41.362619', NULL, '2025-11-10 09:46:41.362619', 'LOW'),
	(74, 'qsdqs', 'dqdsds', '2025-11-10 10:27:37.324065', 25, '2025-11-10 10:27:37.324065', NULL, '2025-11-10 10:27:37.324065', 'LOW'),
	(75, 'RE: test', 'sdqsdqsdqsdd', '2025-11-10 10:34:04.260697', 25, '2025-11-10 10:34:04.260697', NULL, '2025-11-10 10:34:04.260697', 'LOW'),
	(76, 'RE: test', 'qsdqdsqds', '2025-11-10 10:34:21.421781', 25, '2025-11-10 10:34:21.421242', NULL, '2025-11-10 10:34:21.421781', 'LOW'),
	(77, 'qsdqsd', 'sdqsdsdq', '2025-11-10 11:02:28.169471', 23, '2025-11-10 11:02:28.168942', NULL, '2025-11-10 11:02:28.169471', 'LOW'),
	(78, 'qsqsd', 'qdsqdsdd', '2025-11-10 11:22:55.922973', 23, '2025-11-10 11:22:55.922426', NULL, '2025-11-10 11:22:55.922973', 'LOW'),
	(79, 'qsqsdqsd', 'qsdqsdqddddddd', '2025-11-10 11:26:44.566867', 25, '2025-11-10 11:26:44.566867', NULL, '2025-11-10 11:26:44.566867', 'LOW'),
	(80, 'qsdqd', 'qdsqd', '2025-11-10 11:29:49.143449', 25, '2025-11-10 11:29:49.143449', NULL, '2025-11-10 11:29:49.143449', 'LOW'),
	(81, 'qsdqsd', 'qsdqsdqdqs', '2025-11-10 11:30:55.556179', 25, '2025-11-10 11:30:55.555179', NULL, '2025-11-10 11:30:55.556179', 'LOW'),
	(82, 'qsdqds', 'dqdsdd', '2025-11-10 11:32:18.036830', 25, '2025-11-10 11:32:18.036292', NULL, '2025-11-10 11:32:18.036830', 'LOW'),
	(83, 'qsddds', 'dqdsqsdsd', '2025-11-10 11:32:59.303460', 23, '2025-11-10 11:32:59.303460', NULL, '2025-11-10 11:32:59.304458', 'LOW'),
	(84, 'test de case', 'qsdqsdqddsq', '2025-11-10 11:48:03.484786', 25, '2025-11-10 11:48:03.484263', NULL, '2025-11-10 11:48:03.484801', 'LOW'),
	(85, 'test de mumu !', 'qsdqsdqds', '2025-11-10 11:48:04.752741', 24, '2025-11-10 11:48:04.752741', NULL, '2025-11-10 11:48:04.752741', 'LOW'),
	(86, 'dqsdqsd', 'qdqdds', '2025-11-10 11:55:43.274028', 24, '2025-11-10 11:55:43.273490', NULL, '2025-11-10 11:55:43.274028', 'LOW'),
	(87, 'qsdqsd', 'qsdqsddq', '2025-11-10 12:02:49.020681', 24, '2025-11-10 12:02:49.020681', NULL, '2025-11-10 12:02:49.020681', 'LOW'),
	(88, 'RE: qsdqsd', 'qzdqsddsdqdsdqd', '2025-11-10 14:06:46.619184', 25, '2025-11-10 14:06:46.618648', NULL, '2025-11-10 14:06:46.619184', 'LOW'),
	(89, 'qsdqsd', 'sqdqd', '2025-11-13 11:04:38.906202', 23, '2025-11-13 11:04:38.905691', '2025-12-02 18:34:36.585053', '2025-11-13 11:04:38.914922', 'LOW'),
	(90, 'qsdqsd', 'qsdsdqd', '2025-11-13 11:04:55.917222', 23, '2025-11-13 11:04:55.916652', NULL, '2025-11-13 11:04:55.917222', 'LOW'),
	(91, 'IMPORT A LIRE !', 'ATTENTION CECI EST UN MESSAGE DE PRIORITE HAUTE', '2025-11-18 14:22:45.493717', 61, '2025-11-18 14:22:45.402141', '2025-11-18 14:22:40.000000', '2025-11-18 14:22:45.495772', 'URGENT'),
	(92, 'qsdqd', 'qdsqdqdsq', '2025-12-02 18:13:59.562412', 23, '2025-12-02 18:13:59.562412', NULL, '2025-12-02 18:13:59.562412', 'LOW'),
	(93, 'réseau microsoft', 'réseau !', '2025-12-02 18:14:35.923218', 23, '2025-12-02 18:14:35.922696', NULL, '2025-12-02 18:14:35.923218', 'LOW'),
	(94, 'bagnole !', 'Ma bagnole !', '2025-12-02 18:35:55.077775', 23, '2025-12-02 18:35:55.077775', NULL, '2025-12-02 18:35:55.083080', 'LOW'),
	(95, 'qsdqsd', 'qdqsdqdqd', '2025-12-03 07:29:55.463736', 23, '2025-12-03 07:29:55.463196', NULL, '2025-12-03 07:29:55.463736', 'LOW'),
	(96, 'qsdqdq', 'dsqsdqdq', '2025-12-03 07:32:03.111785', 23, '2025-12-03 07:32:03.111258', NULL, '2025-12-03 07:32:03.111785', 'LOW'),
	(97, 'qsdq', 'sdqdsd', '2025-12-03 09:36:45.326095', 23, '2025-12-03 09:36:45.326083', NULL, '2025-12-03 09:36:45.326095', 'LOW'),
	(98, 'qsdqsd', 'qdsqsdq', '2025-12-03 09:43:55.523763', 23, '2025-12-03 09:43:55.523763', NULL, '2025-12-03 09:43:55.523763', 'LOW'),
	(99, 'qsdqsdqsdq', 'dqsqd', '2025-12-03 09:44:30.328492', 23, '2025-12-03 09:44:30.327960', NULL, '2025-12-03 09:44:30.328492', 'LOW'),
	(100, 'qsdqsd', 'qsdqdsq', '2025-12-03 09:48:05.839093', 23, '2025-12-03 09:48:05.839093', NULL, '2025-12-03 09:48:05.839093', 'LOW'),
	(101, 'qsdqsd', 'qsddqds', '2025-12-03 09:48:57.842246', 24, '2025-12-03 09:48:57.842246', NULL, '2025-12-03 09:48:57.842246', 'LOW'),
	(102, 'qsdqds', 'qsdqdds', '2025-12-03 09:50:20.079645', 23, '2025-12-03 09:50:20.079645', NULL, '2025-12-03 09:50:20.079645', 'LOW'),
	(103, 'RE: qsdqds', 'qsdqsdqsdqs', '2025-12-03 10:02:57.421027', 24, '2025-12-03 10:02:57.421027', NULL, '2025-12-03 10:02:57.421027', 'LOW'),
	(104, 'Test !', 'Un autre test !', '2025-12-04 12:50:39.272375', 23, '2025-12-04 12:50:39.271375', NULL, '2025-12-04 12:50:39.272375', 'LOW'),
	(105, 'RE: Test !', 'MAIS OUI TU AS RAISON ! :o', '2025-12-04 12:50:54.810505', 24, '2025-12-04 12:50:54.810505', NULL, '2025-12-04 12:50:54.811048', 'LOW'),
	(106, 'qsdqd', 'qdsqdd', '2025-12-15 08:40:13.374319', 62, '2025-12-15 08:40:13.373786', NULL, '2025-12-15 08:40:13.374319', 'LOW'),
	(107, 'qds', 'dqsdqsdq', '2025-12-15 08:44:48.150163', 23, '2025-12-15 08:44:48.149633', NULL, '2025-12-15 08:44:48.150163', 'LOW'),
	(108, 'RE: qds', 'qdqdsqdds', '2025-12-15 08:44:59.919302', 62, '2025-12-15 08:44:59.918774', NULL, '2025-12-15 08:44:59.919302', 'LOW'),
	(109, 'Test msg222', 'dqsdqsdsd', '2025-12-20 12:14:28.281588', 24, '2025-12-20 12:14:28.280589', NULL, '2025-12-20 12:14:28.281588', 'LOW'),
	(110, 'Test msg33333', 'qdsqsdqdqsd', '2025-12-20 12:14:58.602893', 24, '2025-12-20 12:14:58.602893', NULL, '2025-12-20 12:14:58.602893', 'LOW'),
	(111, 'Scan report — Veterant Raider', '\n                        NAME: Veterant Raider\n\n--- TARGET ---\nTYPE: NPC\nFACTION: none\nPOSITION: zone-transition [Y: 15 ; X: 8]\n\n--- SHIP ---\nSHIP NAME: SG Raptor\nSHIP CATEGORY: Medium\nHP: 110 / 110\nMP: 40 / 40\nBallistic: 25 / 25\nThermal: 25 / 25\nMissile: 45 / 45\n\n--- MODULES ---\n- Ballistic shield lv-1\n- Missile shield lv-2\n- cargo hold lv-2\n- propulsion lv-2\n- hull lv-2\n- thermal weapon lv-2\n                    ', '2026-01-12 11:57:51.325443', 25, '2026-01-12 11:57:51.325443', NULL, '2026-01-12 11:57:51.325443', 'LOW'),
	(112, 'Scan report — Veterant Raider', 'NAME: Veterant Raider\n\n--- TARGET ---\nTYPE: NPC\nFACTION: none\nPOSITION: zone-transition [Y: 15 ; X: 8]\n\n--- SHIP ---\nSHIP NAME: SG Raptor\nSHIP CATEGORY: Medium\nHP: 110 / 110\nMP: 40 / 40\nBallistic: 25 / 25\nThermal: 25 / 25\nMissile: 45 / 45\n\n--- MODULES ---\n- Ballistic shield lv-1\n- Missile shield lv-2\n- cargo hold lv-2\n- propulsion lv-2\n- hull lv-2\n- thermal weapon lv-2', '2026-01-12 12:08:35.336369', 25, '2026-01-12 12:08:35.336369', NULL, '2026-01-12 12:08:35.336369', 'LOW'),
	(113, 'Scan report — Case', 'tdadazdazdazaddz\n        --------------------\n        NAME: Case\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: Faction Democratique\nPOSITION: zone-transition [Y: 8 ; X: 10]\n\n--- SHIP ---\nSHIP NAME: Pioneer Observer\nSHIP CATEGORY: Light\nHP: 75 / 75\nMP: 28 / 50\nBallistic: 35 / 35\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- cargo hold lv-2\n- hull lv-1\n- propulsion lv-3\n- spaceship probe\n- targeting system lv-1\n- missile weapon lv-1', '2026-01-12 13:21:27.094720', 24, '2026-01-12 13:21:27.094720', NULL, '2026-01-12 13:21:27.094720', 'LOW'),
	(114, 'Scan report — Case', 'qsdqsdqdsq\n\nNAME: Case\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: Faction Democratique\nPOSITION: zone-transition [Y: 8 ; X: 10]\n\n--- SHIP ---\nSHIP NAME: Pioneer Observer\nSHIP CATEGORY: Light\nHP: 75 / 75\nMP: 28 / 50\nBallistic: 35 / 35\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- cargo hold lv-2\n- hull lv-1\n- propulsion lv-3\n- spaceship probe\n- targeting system lv-1\n- missile weapon lv-1', '2026-01-12 13:25:47.484383', 24, '2026-01-12 13:25:47.484383', NULL, '2026-01-12 13:25:47.484383', 'LOW'),
	(115, 'Scan report — Murthy', 'Test d\'un texta optionnel\n\nNAME: Murthy\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: culte technologie\nPOSITION: zone-transition [Y: 11 ; X: 7]\nAP: 5 / 10\n\n--- SHIP ---\nSHIP NAME: AstralTech Scout MK I\nSHIP CATEGORY: Light\nHP: 100 / 100\nAP: 5 / 10\nMP: 45 / 45\nBallistic: 15 / 15\nThermal: 45 / 45\nMissile: 15 / 15\n\n--- MODULES ---\n- Thermal shield lv-2\n- cargo hold lv-2\n- hull lv-2\n- propulsion lv-2\n- spaceship probe\n- shield repaire lv-2\n- scavenging module', '2026-01-12 13:36:11.473926', 25, '2026-01-12 13:36:11.473926', NULL, '2026-01-12 13:36:11.473926', 'LOW'),
	(116, 'Scan report — recolteur', 'NAME: recolteur\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: Faction Indépendante\nPOSITION: zone-transition [Y: 9 ; X: 11]\nAP: 10 / 10\n\n--- SHIP ---\nSHIP NAME: Pioneer Gatherer MK I\nSHIP CATEGORY: Light\nHP: 75 / 75\nAP: 10 / 10\nMP: 10 / 45\nBallistic: 30 / 30\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- mining lv-1\n- drilling probe\n- propulsion lv-2\n- cargo hold lv-3\n- hull lv-1', '2026-01-13 07:36:54.840682', 25, '2026-01-13 07:36:54.839682', NULL, '2026-01-13 07:36:54.840682', 'LOW'),
	(117, 'qs', 'sdqsdd', '2026-01-13 07:40:28.085611', 24, '2026-01-13 07:40:28.085611', NULL, '2026-01-13 07:40:28.085611', 'LOW'),
	(118, 'qsdqd', 'qsdqd', '2026-01-13 08:04:44.767240', 24, '2026-01-13 08:04:44.767240', NULL, '2026-01-13 08:04:44.767240', 'LOW'),
	(119, 'Scan report — recolteur', 'NAME: recolteur\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: Faction Indépendante\nPOSITION: zone-transition [Y: 9 ; X: 11]\nAP: 10 / 10\n\n--- SHIP ---\nSHIP NAME: Pioneer Gatherer MK I\nSHIP CATEGORY: Light\nHP: 75 / 75\nAP: 10 / 10\nMP: 10 / 45\nBallistic: 30 / 30\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- mining lv-1\n- drilling probe\n- propulsion lv-2\n- cargo hold lv-3\n- hull lv-1', '2026-01-13 08:08:06.083596', 25, '2026-01-13 08:08:06.082596', NULL, '2026-01-13 08:08:06.083596', 'LOW'),
	(120, 'Scan report — recolteur', 'NAME: recolteur\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: Faction Indépendante\nPOSITION: zone-transition [Y: 9 ; X: 11]\nAP: 10 / 10\n\n--- SHIP ---\nSHIP NAME: Pioneer Gatherer MK I\nSHIP CATEGORY: Light\nHP: 75 / 75\nAP: 10 / 10\nMP: 10 / 45\nBallistic: 30 / 30\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- mining lv-1\n- drilling probe\n- propulsion lv-2\n- cargo hold lv-3\n- hull lv-1', '2026-01-13 08:11:44.680759', 25, '2026-01-13 08:11:44.680759', NULL, '2026-01-13 08:11:44.680759', 'LOW'),
	(121, 'Scan report — recolteur', 'NAME: recolteur\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: Faction Indépendante\nPOSITION: zone-transition [Y: 9 ; X: 11]\nAP: 10 / 10\n\n--- SHIP ---\nSHIP NAME: Pioneer Gatherer MK I\nSHIP CATEGORY: Light\nHP: 75 / 75\nAP: 10 / 10\nMP: 10 / 45\nBallistic: 30 / 30\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- mining lv-1\n- drilling probe\n- propulsion lv-2\n- cargo hold lv-3\n- hull lv-1', '2026-01-13 08:12:18.780149', 25, '2026-01-13 08:12:18.780149', NULL, '2026-01-13 08:12:18.780149', 'LOW'),
	(122, 'Scan report — Deirdre', 'NAME: Deirdre\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: culte technologie\nPOSITION: zone-transition [Y: 11 ; X: 18]\nAP: 10 / 10\n\n--- SHIP ---\nSHIP NAME: BioTech RSRCH MK I\nSHIP CATEGORY: Light\nHP: 75 / 75\nAP: 10 / 10\nMP: 45 / 45\nBallistic: 35 / 35\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- crafting station lv-1\n- propulsion lv-2\n- cargo hold lv-2\n- hull lv-1\n- research lab lv-2', '2026-01-13 08:37:03.877063', 25, '2026-01-13 08:37:03.877063', NULL, '2026-01-13 08:37:03.877063', 'LOW'),
	(123, 'Scan report — Deirdre', 'NAME: Deirdre\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: culte technologie\nPOSITION: zone-transition [Y: 11 ; X: 18]\nAP: 10 / 10\n\n--- SHIP ---\nSHIP NAME: BioTech RSRCH MK I\nSHIP CATEGORY: Light\nHP: 75 / 75\nAP: 10 / 10\nMP: 45 / 45\nBallistic: 35 / 35\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- crafting station lv-1\n- propulsion lv-2\n- cargo hold lv-2\n- hull lv-1\n- research lab lv-2', '2026-01-13 08:38:13.174462', 25, '2026-01-13 08:38:13.174462', NULL, '2026-01-13 08:38:13.174462', 'LOW'),
	(124, 'Scan report — Deirdre', 'NAME: Deirdre\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: culte technologie\nPOSITION: zone-transition [Y: 11 ; X: 18]\nAP: 10 / 10\n\n--- SHIP ---\nSHIP NAME: BioTech RSRCH MK I\nSHIP CATEGORY: Light\nHP: 75 / 75\nAP: 10 / 10\nMP: 45 / 45\nBallistic: 35 / 35\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- crafting station lv-1\n- propulsion lv-2\n- cargo hold lv-2\n- hull lv-1\n- research lab lv-2', '2026-01-13 08:38:18.146011', 25, '2026-01-13 08:38:18.146011', NULL, '2026-01-13 08:38:18.146011', 'LOW'),
	(125, 'Scan report — Light Raider', 'Prout\n\nNAME: Light Raider\n\n--- TARGET ---\nTYPE: NPC\nFACTION: none\nPOSITION: zone-transition [Y: 19 ; X: 32]\n\n--- SHIP ---\nSHIP NAME: SG raider\nSHIP CATEGORY: Light\nHP: 150 / 150\nMP: 20 / 20\nBallistic: 15 / 15\nThermal: 10 / 10\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-1\n- Missile shield lv-1\n- cargo hold lv-1\n- propulsion lv-1\n- hull lv-1\n- shield repaire lv-1\n- Ballistic weapon lv-1', '2026-01-15 14:31:39.962780', 25, '2026-01-15 14:31:39.962780', NULL, '2026-01-15 14:31:39.962780', 'LOW'),
	(126, 'Scan report — Deirdre', 'test\n\nNAME: Deirdre\n\n--- TARGET ---\nTYPE: PLAYER\nFACTION: culte technologie\nPOSITION: zone-transition [Y: 11 ; X: 18]\nAP: 10 / 10\n\n--- SHIP ---\nSHIP NAME: BioTech RSRCH MK I\nSHIP CATEGORY: Light\nHP: 75 / 75\nAP: 10 / 10\nMP: 45 / 45\nBallistic: 35 / 35\nThermal: 15 / 15\nMissile: 15 / 15\n\n--- MODULES ---\n- Ballistic shield lv-2\n- crafting station lv-1\n- propulsion lv-2\n- cargo hold lv-2\n- hull lv-1\n- research lab lv-2', '2026-01-15 14:32:55.409064', 25, '2026-01-15 14:32:55.409064', '2026-01-19 13:34:30.127247', '2026-01-15 14:32:55.409064', 'LOW'),
	(127, 'qsdqsd', 'qsdqd', '2026-01-19 14:11:09.192767', 25, '2026-01-19 14:11:09.192232', NULL, '2026-01-19 14:11:09.192767', 'LOW'),
	(128, 'vvvvv', 'vvvv', '2026-01-19 14:12:25.649645', 25, '2026-01-19 14:12:25.649645', NULL, '2026-01-19 14:12:25.649645', 'LOW'),
	(129, 'qsdqd', 'qdqsd', '2026-01-19 14:15:51.342794', 25, '2026-01-19 14:15:51.342794', NULL, '2026-01-19 14:15:51.342794', 'LOW'),
	(130, 'qsdqdsq', 'dqsddqd', '2026-01-19 14:15:59.116495', 25, '2026-01-19 14:15:59.116495', NULL, '2026-01-19 14:15:59.116495', 'LOW'),
	(131, 'qsddqd', 'qsddq', '2026-01-19 14:16:40.477582', 25, '2026-01-19 14:16:40.477582', NULL, '2026-01-19 14:16:40.477582', 'LOW'),
	(132, 'qsdqsd', 'qsddsd', '2026-01-19 14:18:49.551372', 25, '2026-01-19 14:18:49.551372', NULL, '2026-01-19 14:18:49.551372', 'LOW');
/*!40000 ALTER TABLE `core_privatemessage` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_privatemessagerecipients
CREATE TABLE IF NOT EXISTS `core_privatemessagerecipients` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `is_read` tinyint(1) NOT NULL,
  `message_id` bigint(20) NOT NULL,
  `recipient_id` bigint(20) NOT NULL,
  `is_author` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_privatemessager_message_id_ee8a9ac3_fk_core_priv` (`message_id`),
  KEY `core_privatemessager_recipient_id_0ccf1880_fk_core_play` (`recipient_id`),
  CONSTRAINT `core_privatemessager_message_id_ee8a9ac3_fk_core_priv` FOREIGN KEY (`message_id`) REFERENCES `core_privatemessage` (`id`),
  CONSTRAINT `core_privatemessager_recipient_id_0ccf1880_fk_core_play` FOREIGN KEY (`recipient_id`) REFERENCES `core_player` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_privatemessagerecipients : ~227 rows (environ)
DELETE FROM `core_privatemessagerecipients`;
/*!40000 ALTER TABLE `core_privatemessagerecipients` DISABLE KEYS */;
INSERT INTO `core_privatemessagerecipients` (`id`, `is_read`, `message_id`, `recipient_id`, `is_author`, `created_at`, `deleted_at`, `updated_at`) VALUES
	(15, 0, 16, 24, 1, '2025-10-28 14:39:31.708006', '2025-10-28 15:47:58.393762', '2025-10-28 14:39:31.709006'),
	(16, 1, 16, 23, 0, '2025-10-28 14:39:31.723005', '2025-11-10 10:46:17.904294', '2025-10-28 14:39:31.723005'),
	(17, 0, 17, 24, 1, '2025-10-28 14:49:19.378824', NULL, '2025-10-28 14:49:19.379823'),
	(18, 1, 17, 23, 0, '2025-10-28 14:49:19.425447', '2025-11-10 10:46:16.183898', '2025-10-28 14:49:19.425987'),
	(19, 1, 18, 23, 1, '2025-10-28 14:50:05.660952', '2025-10-28 15:50:51.938561', '2025-10-28 14:50:05.660985'),
	(20, 1, 18, 24, 0, '2025-10-28 14:50:05.673725', '2025-10-28 15:51:08.588606', '2025-10-28 14:50:05.673725'),
	(21, 1, 19, 23, 1, '2025-10-29 08:06:46.937348', '2025-10-29 09:28:16.632137', '2025-10-29 08:06:46.937878'),
	(22, 1, 19, 24, 0, '2025-10-29 08:06:46.968813', NULL, '2025-10-29 08:06:46.968813'),
	(23, 1, 20, 23, 1, '2025-10-29 08:16:57.666444', NULL, '2025-10-29 08:16:57.666965'),
	(24, 1, 20, 24, 0, '2025-10-29 08:16:57.705692', NULL, '2025-10-29 08:16:57.706350'),
	(25, 1, 21, 23, 1, '2025-10-29 08:24:47.569439', NULL, '2025-10-29 08:24:47.569439'),
	(26, 1, 21, 24, 0, '2025-10-29 08:24:47.625122', NULL, '2025-10-29 08:24:47.626122'),
	(27, 1, 22, 23, 1, '2025-10-29 08:27:39.350885', NULL, '2025-10-29 08:27:39.350885'),
	(28, 0, 22, 24, 0, '2025-10-29 08:27:39.363885', NULL, '2025-10-29 08:27:39.364884'),
	(29, 1, 23, 23, 1, '2025-10-29 08:28:02.118929', NULL, '2025-10-29 08:28:02.119929'),
	(30, 0, 23, 24, 0, '2025-10-29 08:28:02.165062', NULL, '2025-10-29 08:28:02.166049'),
	(31, 1, 24, 23, 1, '2025-10-29 11:26:53.001186', NULL, '2025-10-29 11:26:53.001186'),
	(32, 0, 24, 24, 0, '2025-10-29 11:26:53.032179', NULL, '2025-10-29 11:26:53.032717'),
	(33, 1, 25, 23, 1, '2025-10-29 12:39:36.215993', NULL, '2025-10-29 12:39:36.215993'),
	(34, 0, 25, 24, 0, '2025-10-29 12:39:36.229499', NULL, '2025-10-29 12:39:36.230500'),
	(35, 1, 26, 23, 1, '2025-10-29 15:24:59.908628', NULL, '2025-10-29 15:24:59.908628'),
	(36, 1, 26, 24, 0, '2025-10-29 15:24:59.971293', NULL, '2025-11-18 14:40:31.711637'),
	(37, 1, 27, 23, 1, '2025-10-29 15:25:00.073562', NULL, '2025-10-29 15:25:00.073562'),
	(38, 1, 27, 24, 0, '2025-10-29 15:25:00.087561', NULL, '2025-10-29 15:25:00.087561'),
	(39, 1, 28, 24, 1, '2025-10-29 15:30:22.256623', NULL, '2025-10-29 15:30:22.256623'),
	(40, 1, 28, 23, 0, '2025-10-29 15:30:22.268619', '2025-11-10 10:46:14.483415', '2025-10-29 15:30:22.268619'),
	(41, 1, 29, 23, 1, '2025-10-29 15:30:42.570668', NULL, '2025-10-29 15:30:42.571204'),
	(42, 0, 29, 24, 0, '2025-10-29 15:30:42.620883', NULL, '2025-10-29 15:30:42.621423'),
	(43, 1, 30, 23, 1, '2025-11-01 11:45:21.095964', NULL, '2025-11-01 11:45:21.095964'),
	(44, 1, 31, 23, 1, '2025-11-01 11:46:23.775208', NULL, '2025-11-01 11:46:23.775783'),
	(45, 1, 32, 23, 1, '2025-11-01 11:47:03.789370', NULL, '2025-11-01 11:47:03.789370'),
	(46, 1, 33, 23, 1, '2025-11-01 11:47:38.049291', '2025-11-10 10:46:12.323124', '2025-11-01 11:47:38.049291'),
	(47, 0, 33, 23, 0, '2025-11-01 11:47:38.064745', '2025-11-10 10:46:12.323124', '2025-11-01 11:47:38.065746'),
	(48, 0, 33, 24, 0, '2025-11-01 11:47:38.064745', NULL, '2025-11-01 11:47:38.065746'),
	(49, 0, 33, 22, 0, '2025-11-01 11:47:38.064745', NULL, '2025-11-01 11:47:38.065746'),
	(54, 1, 34, 23, 1, '2025-11-01 12:59:22.126058', NULL, '2025-11-01 12:59:22.126072'),
	(55, 0, 34, 24, 0, '2025-11-01 12:59:22.139828', NULL, '2025-11-01 12:59:22.140831'),
	(56, 1, 35, 23, 1, '2025-11-01 13:06:18.461492', '2025-11-10 10:46:10.393787', '2025-11-01 13:06:18.462002'),
	(57, 0, 35, 23, 0, '2025-11-01 13:06:18.501561', '2025-11-10 10:46:10.393787', '2025-11-01 13:06:18.502562'),
	(58, 0, 35, 24, 0, '2025-11-01 13:06:18.501561', NULL, '2025-11-01 13:06:18.502562'),
	(59, 0, 35, 22, 0, '2025-11-01 13:06:18.501561', NULL, '2025-11-01 13:06:18.502562'),
	(64, 1, 36, 23, 1, '2025-11-01 13:07:45.747038', NULL, '2025-11-01 13:07:45.747038'),
	(65, 0, 36, 24, 0, '2025-11-01 13:07:45.774687', NULL, '2025-11-01 13:07:45.774687'),
	(66, 1, 37, 24, 1, '2025-11-01 13:09:28.033623', NULL, '2025-11-01 13:09:28.034619'),
	(67, 0, 37, 24, 0, '2025-11-01 13:09:28.049704', NULL, '2025-11-01 13:09:28.050697'),
	(68, 1, 38, 23, 1, '2025-11-01 13:10:45.105805', NULL, '2025-11-01 13:10:45.105805'),
	(69, 0, 38, 24, 0, '2025-11-01 13:10:45.138891', NULL, '2025-11-01 13:10:45.138891'),
	(70, 1, 39, 23, 1, '2025-11-01 13:11:51.439242', NULL, '2025-11-01 13:11:51.440241'),
	(71, 0, 39, 24, 0, '2025-11-01 13:11:51.505812', NULL, '2025-11-01 13:11:51.506814'),
	(72, 1, 40, 23, 1, '2025-11-01 13:12:45.612038', NULL, '2025-11-01 13:12:45.612576'),
	(73, 0, 40, 24, 0, '2025-11-01 13:12:45.669925', NULL, '2025-11-01 13:12:45.670455'),
	(74, 1, 41, 24, 1, '2025-11-01 13:13:49.155718', NULL, '2025-11-01 13:13:49.155718'),
	(75, 0, 41, 24, 0, '2025-11-01 13:13:49.189163', NULL, '2025-11-01 13:13:49.189703'),
	(76, 1, 42, 24, 1, '2025-11-01 13:15:09.325819', NULL, '2025-11-01 13:15:09.325819'),
	(77, 0, 42, 23, 0, '2025-11-01 13:15:09.342488', '2025-11-10 10:46:04.429023', '2025-11-01 13:15:09.343031'),
	(78, 1, 43, 24, 1, '2025-11-01 13:16:09.634067', NULL, '2025-11-01 13:16:09.634067'),
	(79, 0, 43, 24, 0, '2025-11-01 13:16:09.648020', NULL, '2025-11-01 13:16:09.649020'),
	(80, 1, 44, 23, 1, '2025-11-01 13:21:03.019314', NULL, '2025-11-01 13:21:03.019314'),
	(81, 0, 44, 24, 0, '2025-11-01 13:21:03.052314', NULL, '2025-11-01 13:21:03.053314'),
	(82, 1, 45, 23, 1, '2025-11-01 13:24:25.292311', NULL, '2025-11-01 13:24:25.292844'),
	(83, 0, 45, 24, 0, '2025-11-01 13:24:25.313585', NULL, '2025-11-01 13:24:25.313585'),
	(84, 1, 46, 23, 1, '2025-11-01 13:26:48.335892', NULL, '2025-11-01 13:26:48.335892'),
	(85, 0, 46, 24, 0, '2025-11-01 13:26:48.354892', NULL, '2025-11-01 13:26:48.355892'),
	(86, 1, 47, 23, 1, '2025-11-01 13:40:33.672768', NULL, '2025-11-01 13:40:33.672768'),
	(87, 0, 47, 24, 0, '2025-11-01 13:40:33.688119', NULL, '2025-11-01 13:40:33.688119'),
	(88, 1, 48, 23, 1, '2025-11-01 13:50:00.402604', NULL, '2025-11-01 13:50:00.402604'),
	(89, 1, 48, 24, 0, '2025-11-01 13:50:00.418602', NULL, '2025-11-18 08:04:45.453471'),
	(90, 1, 49, 24, 1, '2025-11-01 14:36:18.378110', NULL, '2025-11-01 14:36:18.378110'),
	(91, 1, 49, 23, 0, '2025-11-01 14:36:18.426509', '2025-11-10 10:46:08.522832', '2025-11-01 14:36:18.426509'),
	(92, 1, 50, 24, 1, '2025-11-01 14:36:42.877298', NULL, '2025-11-01 14:36:42.877827'),
	(93, 0, 50, 23, 0, '2025-11-01 14:36:42.891543', '2025-11-10 10:46:02.396799', '2025-11-01 14:36:42.892075'),
	(94, 1, 51, 24, 1, '2025-11-01 14:41:00.811506', NULL, '2025-11-01 14:41:00.811506'),
	(95, 0, 51, 23, 0, '2025-11-01 14:41:00.827627', '2025-11-10 10:45:59.149925', '2025-11-01 14:41:00.828176'),
	(96, 1, 52, 24, 1, '2025-11-01 14:43:44.181419', NULL, '2025-11-01 14:43:44.182181'),
	(97, 0, 52, 23, 0, '2025-11-01 14:43:44.195515', '2025-11-10 10:46:00.641979', '2025-11-01 14:43:44.195515'),
	(98, 1, 53, 24, 1, '2025-11-01 14:48:54.725627', NULL, '2025-11-01 14:48:54.726626'),
	(99, 1, 53, 23, 0, '2025-11-01 14:48:54.754756', '2025-11-10 10:45:57.055639', '2025-11-01 14:48:54.755755'),
	(100, 1, 54, 24, 1, '2025-11-01 15:03:04.673438', NULL, '2025-11-01 15:03:04.673438'),
	(101, 0, 54, 23, 0, '2025-11-01 15:03:04.705394', '2025-11-10 10:45:55.110134', '2025-11-01 15:03:04.705394'),
	(102, 1, 55, 24, 1, '2025-11-01 15:05:37.942741', NULL, '2025-11-01 15:05:37.942741'),
	(103, 1, 55, 23, 0, '2025-11-01 15:05:37.955718', '2025-11-10 10:45:52.965190', '2025-11-01 15:05:37.956239'),
	(104, 1, 56, 23, 1, '2025-11-01 15:06:32.766267', NULL, '2025-11-01 15:06:32.766803'),
	(105, 1, 56, 24, 0, '2025-11-01 15:06:32.781975', NULL, '2025-11-01 15:06:32.781975'),
	(106, 1, 57, 24, 1, '2025-11-01 15:19:07.083461', NULL, '2025-11-01 15:19:07.084460'),
	(107, 1, 57, 23, 0, '2025-11-01 15:19:07.098460', '2025-11-10 10:45:51.003686', '2025-11-01 15:19:07.099459'),
	(108, 1, 58, 24, 1, '2025-11-01 15:19:58.043119', NULL, '2025-11-01 15:19:58.043119'),
	(109, 1, 58, 23, 0, '2025-11-01 15:19:58.057389', '2025-11-01 16:20:33.648022', '2025-11-01 15:19:58.057389'),
	(110, 1, 59, 24, 1, '2025-11-01 15:20:17.747573', NULL, '2025-11-01 15:20:17.747573'),
	(111, 1, 59, 23, 0, '2025-11-01 15:20:17.762573', '2025-11-01 16:24:57.136306', '2025-11-01 15:20:17.762573'),
	(112, 1, 60, 24, 1, '2025-11-01 15:24:20.615290', NULL, '2025-11-01 15:24:20.616289'),
	(113, 1, 60, 23, 0, '2025-11-01 15:24:20.648288', '2025-11-01 16:24:54.619430', '2025-11-01 15:24:20.649291'),
	(114, 1, 61, 23, 1, '2025-11-01 15:24:42.381082', NULL, '2025-11-01 15:24:42.382083'),
	(115, 1, 61, 24, 0, '2025-11-01 15:24:42.398083', NULL, '2025-11-01 15:24:42.399084'),
	(116, 1, 62, 23, 1, '2025-11-01 15:25:26.635659', NULL, '2025-11-01 15:25:26.636289'),
	(117, 1, 62, 24, 0, '2025-11-01 15:25:26.649153', NULL, '2025-11-01 15:25:26.649153'),
	(118, 1, 63, 23, 1, '2025-11-10 07:42:12.115371', NULL, '2025-11-10 07:42:12.115371'),
	(119, 1, 63, 25, 0, '2025-11-10 07:42:12.129368', '2026-01-19 13:34:40.935879', '2025-11-10 07:42:12.129368'),
	(120, 1, 64, 25, 1, '2025-11-10 07:55:14.225449', NULL, '2025-11-10 07:55:14.225984'),
	(121, 0, 64, 23, 0, '2025-11-10 07:55:14.241780', '2025-11-10 10:45:48.910411', '2025-11-10 07:55:14.241780'),
	(122, 1, 65, 25, 1, '2025-11-10 08:45:46.925248', NULL, '2025-11-10 08:45:46.925248'),
	(123, 0, 65, 23, 0, '2025-11-10 08:45:46.940990', '2025-11-10 10:45:46.665168', '2025-11-10 08:45:46.941522'),
	(124, 1, 66, 25, 1, '2025-11-10 08:53:35.769411', NULL, '2025-11-10 08:53:35.769411'),
	(125, 0, 66, 23, 0, '2025-11-10 08:53:35.785086', '2025-11-10 10:45:44.804517', '2025-11-10 08:53:35.785086'),
	(126, 1, 67, 25, 1, '2025-11-10 09:35:32.307380', NULL, '2025-11-10 09:35:32.307380'),
	(127, 1, 67, 23, 0, '2025-11-10 09:35:32.321849', '2025-11-10 10:45:42.849585', '2025-11-10 09:35:32.322849'),
	(128, 1, 68, 25, 1, '2025-11-10 09:36:17.859791', NULL, '2025-11-10 09:36:17.860516'),
	(129, 0, 68, 23, 0, '2025-11-10 09:36:17.875600', '2025-11-10 10:45:38.362554', '2025-11-10 09:36:17.876131'),
	(130, 1, 69, 25, 1, '2025-11-10 09:36:28.432369', NULL, '2025-11-10 09:36:28.432903'),
	(131, 0, 69, 23, 0, '2025-11-10 09:36:28.447482', '2025-11-10 10:45:36.705902', '2025-11-10 09:36:28.448483'),
	(132, 1, 70, 25, 1, '2025-11-10 09:38:13.879022', NULL, '2025-11-10 09:38:13.879022'),
	(133, 0, 70, 23, 0, '2025-11-10 09:38:13.893877', '2025-11-10 10:45:35.115771', '2025-11-10 09:38:13.893877'),
	(134, 1, 71, 25, 1, '2025-11-10 09:40:43.938176', NULL, '2025-11-10 09:40:43.939177'),
	(135, 0, 71, 23, 0, '2025-11-10 09:40:44.016517', '2025-11-10 10:45:33.401620', '2025-11-10 09:40:44.016517'),
	(136, 1, 72, 25, 1, '2025-11-10 09:41:29.362976', NULL, '2025-11-10 09:41:29.363977'),
	(137, 0, 72, 23, 0, '2025-11-10 09:41:29.656062', '2025-11-10 10:45:31.797293', '2025-11-10 09:41:29.657063'),
	(138, 1, 73, 25, 1, '2025-11-10 09:46:41.388528', NULL, '2025-11-10 09:46:41.388560'),
	(139, 0, 73, 23, 0, '2025-11-10 09:46:41.402406', NULL, '2025-11-10 09:46:41.402406'),
	(140, 1, 74, 25, 1, '2025-11-10 10:27:37.354337', NULL, '2025-11-10 10:27:37.354337'),
	(141, 0, 74, 23, 0, '2025-11-10 10:27:37.368336', NULL, '2025-11-10 10:27:37.369338'),
	(142, 1, 75, 25, 1, '2025-11-10 10:34:04.291118', NULL, '2025-11-10 10:34:04.291118'),
	(143, 0, 75, 23, 0, '2025-11-10 10:34:04.306443', NULL, '2025-11-10 10:34:04.306443'),
	(144, 1, 76, 25, 1, '2025-11-10 10:34:21.444866', NULL, '2025-11-10 10:34:21.444866'),
	(145, 0, 76, 23, 0, '2025-11-10 10:34:21.459246', NULL, '2025-11-10 10:34:21.459782'),
	(146, 1, 77, 23, 1, '2025-11-10 11:02:28.208637', NULL, '2025-11-10 11:02:28.209158'),
	(147, 1, 77, 25, 0, '2025-11-10 11:02:28.223843', '2026-01-19 13:34:39.107898', '2025-11-10 11:02:28.223843'),
	(148, 1, 78, 23, 1, '2025-11-10 11:22:55.964053', NULL, '2025-11-10 11:22:55.964063'),
	(149, 1, 78, 25, 0, '2025-11-10 11:22:55.978451', '2026-01-19 13:34:37.430256', '2025-11-10 11:22:55.978451'),
	(150, 1, 79, 25, 1, '2025-11-10 11:26:44.632155', NULL, '2025-11-10 11:26:44.632155'),
	(151, 0, 79, 23, 0, '2025-11-10 11:26:44.646155', NULL, '2025-11-10 11:26:44.646155'),
	(152, 1, 80, 25, 1, '2025-11-10 11:29:49.329172', NULL, '2025-11-10 11:29:49.329172'),
	(153, 0, 80, 23, 0, '2025-11-10 11:29:49.509207', NULL, '2025-11-10 11:29:49.509207'),
	(154, 1, 81, 25, 1, '2025-11-10 11:30:55.588495', NULL, '2025-11-10 11:30:55.588495'),
	(155, 0, 81, 23, 0, '2025-11-10 11:30:55.602542', NULL, '2025-11-10 11:30:55.602542'),
	(156, 1, 82, 25, 1, '2025-11-10 11:32:18.076624', NULL, '2025-11-10 11:32:18.076624'),
	(157, 0, 82, 23, 0, '2025-11-10 11:32:18.090069', NULL, '2025-11-10 11:32:18.091120'),
	(158, 1, 83, 23, 1, '2025-11-10 11:32:59.348452', NULL, '2025-11-10 11:32:59.348452'),
	(159, 0, 83, 23, 0, '2025-11-10 11:32:59.362486', NULL, '2025-11-10 11:32:59.363486'),
	(160, 1, 84, 25, 1, '2025-11-10 11:48:03.512868', NULL, '2025-11-10 11:48:03.512868'),
	(161, 0, 84, 23, 0, '2025-11-10 11:48:03.526838', NULL, '2025-11-10 11:48:03.526838'),
	(162, 1, 85, 24, 1, '2025-11-10 11:48:04.780978', NULL, '2025-11-10 11:48:04.780978'),
	(163, 0, 85, 23, 0, '2025-11-10 11:48:04.794714', NULL, '2025-11-10 11:48:04.795846'),
	(164, 1, 86, 24, 1, '2025-11-10 11:55:43.300798', NULL, '2025-11-10 11:55:43.301317'),
	(165, 1, 86, 23, 0, '2025-11-10 11:55:43.313870', '2025-11-10 13:19:39.913198', '2025-11-10 11:55:43.313870'),
	(166, 1, 87, 24, 1, '2025-11-10 12:02:49.040985', NULL, '2025-11-10 12:02:49.040985'),
	(167, 1, 87, 23, 0, '2025-11-10 12:02:49.054420', NULL, '2025-11-10 12:02:49.055419'),
	(168, 1, 88, 25, 1, '2025-11-10 14:06:46.660076', NULL, '2025-11-10 14:06:46.660586'),
	(169, 1, 88, 23, 0, '2025-11-10 14:06:46.708260', NULL, '2025-11-10 14:06:46.709261'),
	(170, 1, 89, 23, 1, '2025-11-13 11:04:38.933783', '2025-12-02 18:34:36.564955', '2025-11-13 11:04:38.934316'),
	(171, 1, 89, 23, 0, '2025-11-13 11:04:38.960330', '2025-12-02 18:34:36.564955', '2025-11-13 11:04:38.961331'),
	(172, 1, 90, 23, 1, '2025-11-13 11:04:55.938187', NULL, '2025-11-13 11:04:55.938187'),
	(173, 1, 90, 24, 0, '2025-11-13 11:04:55.970018', NULL, '2025-11-13 11:04:55.970744'),
	(174, 1, 92, 23, 1, '2025-12-02 18:13:59.614789', NULL, '2025-12-02 18:13:59.614789'),
	(175, 0, 92, 24, 0, '2025-12-02 18:13:59.633992', NULL, '2025-12-02 18:13:59.634531'),
	(176, 1, 93, 23, 1, '2025-12-02 18:14:35.960139', NULL, '2025-12-02 18:14:35.961138'),
	(177, 1, 93, 24, 0, '2025-12-02 18:14:36.000403', NULL, '2025-12-02 18:14:36.000941'),
	(178, 1, 94, 23, 1, '2025-12-02 18:35:55.107376', NULL, '2025-12-02 18:35:55.107376'),
	(179, 0, 94, 24, 0, '2025-12-02 18:35:55.139242', NULL, '2025-12-02 18:35:55.140242'),
	(180, 1, 95, 23, 1, '2025-12-03 07:29:55.512227', NULL, '2025-12-03 07:29:55.513228'),
	(181, 0, 95, 24, 0, '2025-12-03 07:29:55.533041', NULL, '2025-12-03 07:29:55.533548'),
	(182, 1, 96, 23, 1, '2025-12-03 07:32:03.144855', NULL, '2025-12-03 07:32:03.145362'),
	(183, 0, 96, 24, 0, '2025-12-03 07:32:03.185213', NULL, '2025-12-03 07:32:03.185910'),
	(184, 1, 97, 23, 1, '2025-12-03 09:36:45.343423', NULL, '2025-12-03 09:36:45.343423'),
	(185, 0, 97, 24, 0, '2025-12-03 09:36:45.392915', NULL, '2025-12-03 09:36:45.393474'),
	(186, 1, 98, 23, 1, '2025-12-03 09:43:55.539493', NULL, '2025-12-03 09:43:55.539493'),
	(187, 0, 98, 24, 0, '2025-12-03 09:43:55.574368', NULL, '2025-12-03 09:43:55.574898'),
	(188, 1, 99, 23, 1, '2025-12-03 09:44:30.347383', NULL, '2025-12-03 09:44:30.347383'),
	(189, 0, 99, 24, 0, '2025-12-03 09:44:30.380059', NULL, '2025-12-03 09:44:30.380594'),
	(190, 1, 100, 23, 1, '2025-12-03 09:48:05.860113', NULL, '2025-12-03 09:48:05.860113'),
	(191, 0, 100, 24, 0, '2025-12-03 09:48:05.925602', NULL, '2025-12-03 09:48:05.926121'),
	(192, 1, 101, 24, 1, '2025-12-03 09:48:57.863242', NULL, '2025-12-03 09:48:57.863242'),
	(193, 0, 101, 23, 0, '2025-12-03 09:48:57.896223', NULL, '2025-12-03 09:48:57.896750'),
	(194, 1, 102, 23, 1, '2025-12-03 09:50:20.093540', NULL, '2025-12-03 09:50:20.094541'),
	(195, 1, 102, 24, 0, '2025-12-03 09:50:20.151876', NULL, '2025-12-03 09:50:20.152404'),
	(196, 1, 103, 24, 1, '2025-12-03 10:02:57.442933', NULL, '2025-12-03 10:02:57.442933'),
	(197, 0, 103, 23, 0, '2025-12-03 10:02:57.517183', NULL, '2025-12-03 10:02:57.518182'),
	(198, 1, 104, 23, 1, '2025-12-04 12:50:39.289377', NULL, '2025-12-04 12:50:39.289377'),
	(199, 1, 104, 24, 0, '2025-12-04 12:50:39.332563', NULL, '2025-12-04 12:50:39.332563'),
	(200, 1, 105, 24, 1, '2025-12-04 12:50:54.834645', NULL, '2025-12-04 12:50:54.835648'),
	(201, 1, 105, 23, 0, '2025-12-04 12:50:54.898306', NULL, '2025-12-04 12:50:54.899304'),
	(202, 1, 106, 62, 1, '2025-12-15 08:40:13.390661', NULL, '2025-12-15 08:40:13.390661'),
	(203, 1, 106, 24, 0, '2025-12-15 08:40:13.445340', NULL, '2025-12-15 08:40:13.445863'),
	(204, 1, 107, 23, 1, '2025-12-15 08:44:48.167512', NULL, '2025-12-15 08:44:48.167512'),
	(205, 1, 107, 62, 0, '2025-12-15 08:44:48.210342', NULL, '2025-12-15 08:44:48.210438'),
	(206, 1, 108, 62, 1, '2025-12-15 08:44:59.941637', NULL, '2025-12-15 08:44:59.941637'),
	(207, 1, 108, 23, 0, '2025-12-15 08:44:59.975296', NULL, '2025-12-15 08:44:59.976355'),
	(208, 1, 109, 24, 1, '2025-12-20 12:14:28.300587', NULL, '2025-12-20 12:14:28.300587'),
	(209, 0, 109, 23, 0, '2025-12-20 12:14:28.333564', NULL, '2025-12-20 12:14:28.333564'),
	(210, 1, 110, 24, 1, '2025-12-20 12:14:58.629965', NULL, '2025-12-20 12:14:58.629965'),
	(211, 0, 110, 62, 0, '2025-12-20 12:14:58.661496', NULL, '2025-12-20 12:14:58.662493'),
	(212, 1, 111, 25, 1, '2026-01-12 11:57:51.405554', NULL, '2026-01-12 11:57:51.406554'),
	(213, 1, 111, 24, 0, '2026-01-12 11:57:51.423559', NULL, '2026-01-12 11:57:51.423559'),
	(214, 1, 112, 25, 1, '2026-01-12 12:08:35.379369', NULL, '2026-01-12 12:08:35.379369'),
	(215, 1, 112, 24, 0, '2026-01-12 12:08:35.470039', NULL, '2026-01-12 12:08:35.470039'),
	(216, 1, 113, 24, 1, '2026-01-12 13:21:27.121717', NULL, '2026-01-12 13:21:27.121717'),
	(217, 1, 113, 25, 0, '2026-01-12 13:21:27.140719', '2026-01-19 13:34:35.360413', '2026-01-12 13:21:27.140719'),
	(218, 1, 114, 24, 1, '2026-01-12 13:25:47.502383', NULL, '2026-01-12 13:25:47.502383'),
	(219, 1, 114, 25, 0, '2026-01-12 13:25:47.523380', '2026-01-19 13:34:33.402172', '2026-01-12 13:25:47.524031'),
	(220, 1, 115, 25, 1, '2026-01-12 13:36:11.495929', '2026-01-12 13:48:13.298421', '2026-01-12 13:36:11.495929'),
	(221, 1, 115, 24, 0, '2026-01-12 13:36:11.514929', NULL, '2026-01-12 13:36:11.514929'),
	(222, 1, 116, 25, 1, '2026-01-13 07:36:54.856681', NULL, '2026-01-13 07:36:54.857680'),
	(223, 1, 116, 24, 0, '2026-01-13 07:36:54.872683', NULL, '2026-01-13 07:36:54.872683'),
	(224, 1, 117, 24, 1, '2026-01-13 07:40:28.109621', NULL, '2026-01-13 07:40:28.110149'),
	(225, 0, 117, 25, 0, '2026-01-13 07:40:28.125611', '2026-01-13 07:40:41.204168', '2026-01-13 07:40:28.125611'),
	(226, 1, 118, 24, 1, '2026-01-13 08:04:44.789801', NULL, '2026-01-13 08:04:44.789801'),
	(227, 1, 118, 25, 0, '2026-01-13 08:04:44.823055', '2026-01-19 13:34:31.758922', '2026-01-13 08:04:44.823585'),
	(228, 1, 119, 25, 1, '2026-01-13 08:08:06.103595', NULL, '2026-01-13 08:08:06.103595'),
	(229, 0, 119, 24, 0, '2026-01-13 08:08:06.117596', NULL, '2026-01-13 08:08:06.118596'),
	(230, 1, 120, 25, 1, '2026-01-13 08:11:44.702760', NULL, '2026-01-13 08:11:44.702760'),
	(231, 0, 120, 24, 0, '2026-01-13 08:11:44.725862', NULL, '2026-01-13 08:11:44.726861'),
	(232, 1, 121, 25, 1, '2026-01-13 08:12:18.815247', NULL, '2026-01-13 08:12:18.815247'),
	(233, 0, 121, 24, 0, '2026-01-13 08:12:18.836197', NULL, '2026-01-13 08:12:18.837196'),
	(234, 1, 122, 25, 1, '2026-01-13 08:37:03.891058', NULL, '2026-01-13 08:37:03.891058'),
	(235, 0, 122, 24, 0, '2026-01-13 08:37:03.909062', NULL, '2026-01-13 08:37:03.910062'),
	(236, 1, 123, 25, 1, '2026-01-13 08:38:13.192460', NULL, '2026-01-13 08:38:13.192460'),
	(237, 0, 123, 23, 0, '2026-01-13 08:38:13.221493', NULL, '2026-01-13 08:38:13.222493'),
	(238, 1, 124, 25, 1, '2026-01-13 08:38:18.167585', NULL, '2026-01-13 08:38:18.167585'),
	(239, 0, 124, 23, 0, '2026-01-13 08:38:18.180834', NULL, '2026-01-13 08:38:18.181372'),
	(240, 1, 125, 25, 1, '2026-01-15 14:31:40.005779', NULL, '2026-01-15 14:31:40.005779'),
	(241, 0, 125, 24, 0, '2026-01-15 14:31:40.026779', NULL, '2026-01-15 14:31:40.027781'),
	(242, 1, 126, 25, 1, '2026-01-15 14:32:55.428635', '2026-01-19 13:34:30.104099', '2026-01-15 14:32:55.428635'),
	(243, 1, 126, 25, 0, '2026-01-15 14:32:55.447683', '2026-01-19 13:34:30.104099', '2026-01-15 14:32:55.448682'),
	(244, 1, 127, 25, 1, '2026-01-19 14:11:09.215551', NULL, '2026-01-19 14:11:09.215551'),
	(245, 0, 127, 25, 0, '2026-01-19 14:11:09.255187', NULL, '2026-01-19 14:11:09.255719'),
	(246, 1, 128, 25, 1, '2026-01-19 14:12:25.691253', NULL, '2026-01-19 14:12:25.691253'),
	(247, 0, 128, 25, 0, '2026-01-19 14:12:25.731175', NULL, '2026-01-19 14:12:25.732173'),
	(248, 1, 129, 25, 1, '2026-01-19 14:15:51.363952', NULL, '2026-01-19 14:15:51.363952'),
	(249, 0, 129, 25, 0, '2026-01-19 14:15:51.403643', NULL, '2026-01-19 14:15:51.404172'),
	(250, 1, 130, 25, 1, '2026-01-19 14:15:59.137495', NULL, '2026-01-19 14:15:59.137495'),
	(251, 0, 130, 25, 0, '2026-01-19 14:15:59.178188', NULL, '2026-01-19 14:15:59.178721'),
	(252, 1, 131, 25, 1, '2026-01-19 14:16:40.497420', NULL, '2026-01-19 14:16:40.498419'),
	(253, 1, 131, 25, 0, '2026-01-19 14:16:40.538526', NULL, '2026-01-19 14:16:40.538526'),
	(254, 1, 132, 25, 1, '2026-01-19 14:18:49.573219', NULL, '2026-01-19 14:18:49.574219'),
	(255, 1, 132, 25, 0, '2026-01-19 14:18:49.606759', NULL, '2026-01-19 14:18:49.607278');
/*!40000 ALTER TABLE `core_privatemessagerecipients` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_recipe
CREATE TABLE IF NOT EXISTS `core_recipe` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `value_needed` double NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `skill_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `core_recipe_skill_id_ec10c3ae_fk_core_skill_id` (`skill_id`),
  CONSTRAINT `core_recipe_skill_id_ec10c3ae_fk_core_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `core_skill` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_recipe : ~0 rows (environ)
DELETE FROM `core_recipe`;
/*!40000 ALTER TABLE `core_recipe` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_recipe` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_research
CREATE TABLE IF NOT EXISTS `core_research` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `image` varchar(250) NOT NULL,
  `time_to_complete` int(10) unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `skill_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `core_research_skill_id_60ca640b_fk_core_skill_id` (`skill_id`),
  CONSTRAINT `core_research_skill_id_60ca640b_fk_core_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `core_skill` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_research : ~0 rows (environ)
DELETE FROM `core_research`;
/*!40000 ALTER TABLE `core_research` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_research` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_resource
CREATE TABLE IF NOT EXISTS `core_resource` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `data` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_resource : ~2 rows (environ)
DELETE FROM `core_resource`;
/*!40000 ALTER TABLE `core_resource` DISABLE KEYS */;
INSERT INTO `core_resource` (`id`, `name`, `data`, `created_at`, `updated_at`) VALUES
	(1, 'none', '{}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(2, 'credit', '{}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000');
/*!40000 ALTER TABLE `core_resource` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_scaneffect
CREATE TABLE IF NOT EXISTS `core_scaneffect` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `target_type` varchar(12) NOT NULL,
  `target_id` int(10) unsigned NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `invalidated_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `scanner_id` bigint(20) NOT NULL,
  `sector_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_scaneffect_sector_id_64161e53_fk_core_sector_id` (`sector_id`),
  KEY `core_scanef_scanner_39d20e_idx` (`scanner_id`,`target_type`,`target_id`),
  KEY `core_scanef_expires_9bb33c_idx` (`expires_at`),
  CONSTRAINT `core_scaneffect_scanner_id_f4c40ccc_fk_core_player_id` FOREIGN KEY (`scanner_id`) REFERENCES `core_player` (`id`),
  CONSTRAINT `core_scaneffect_sector_id_64161e53_fk_core_sector_id` FOREIGN KEY (`sector_id`) REFERENCES `core_sector` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_scaneffect : ~0 rows (environ)
DELETE FROM `core_scaneffect`;
/*!40000 ALTER TABLE `core_scaneffect` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_scaneffect` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_scanintel
CREATE TABLE IF NOT EXISTS `core_scanintel` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `scanner_player_id` int(11) NOT NULL,
  `target_type` varchar(8) NOT NULL,
  `target_id` int(11) NOT NULL,
  `sector_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `invalidated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `core_scanin_scanner_d8e362_idx` (`scanner_player_id`,`sector_id`),
  KEY `core_scanin_target__3c3495_idx` (`target_type`,`target_id`,`sector_id`),
  KEY `core_scanintel_scanner_player_id_8fb909a3` (`scanner_player_id`),
  KEY `core_scanintel_target_id_b2860e98` (`target_id`),
  KEY `core_scanintel_sector_id_96ea3750` (`sector_id`),
  KEY `core_scanintel_expires_at_909cb031` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=242 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_scanintel : ~127 rows (environ)
DELETE FROM `core_scanintel`;
/*!40000 ALTER TABLE `core_scanintel` DISABLE KEYS */;
INSERT INTO `core_scanintel` (`id`, `scanner_player_id`, `target_type`, `target_id`, `sector_id`, `created_at`, `expires_at`, `invalidated_at`) VALUES
	(87, 25, 'npc', 1223, 3, '2026-01-13 23:41:58.222554', '2026-01-13 23:42:28.222554', '2026-01-13 23:42:29.801673'),
	(88, 25, 'npc', 1223, 3, '2026-01-13 23:42:35.827546', '2026-01-13 23:43:05.827546', '2026-01-13 23:43:10.872781'),
	(89, 25, 'npc', 1223, 3, '2026-01-13 23:43:39.643406', '2026-01-13 23:44:09.643406', '2026-01-13 23:44:49.743701'),
	(90, 25, 'npc', 1222, 3, '2026-01-15 07:53:17.629205', '2026-01-15 07:53:47.629205', '2026-01-15 07:53:56.972146'),
	(91, 25, 'npc', 1222, 3, '2026-01-15 07:54:00.424302', '2026-01-15 07:54:30.424302', '2026-01-15 07:54:45.754092'),
	(92, 25, 'npc', 1222, 3, '2026-01-15 07:55:01.617162', '2026-01-15 07:55:31.617162', '2026-01-15 07:56:25.200535'),
	(93, 25, 'npc', 1222, 3, '2026-01-15 08:30:02.614342', '2026-01-15 08:30:32.614342', '2026-01-15 08:31:27.122877'),
	(94, 25, 'npc', 1222, 3, '2026-01-15 08:32:24.899003', '2026-01-15 08:32:54.899003', '2026-01-15 08:34:03.421523'),
	(95, 25, 'npc', 1222, 3, '2026-01-15 08:41:21.773169', '2026-01-15 08:41:51.773169', '2026-01-15 08:42:11.768048'),
	(96, 25, 'pc', 26, 3, '2026-01-15 08:42:11.853575', '2026-01-15 08:42:41.853575', '2026-01-15 08:43:52.973584'),
	(97, 25, 'pc', 26, 3, '2026-01-15 08:43:53.049355', '2026-01-15 08:44:23.049355', '2026-01-15 08:43:57.697339'),
	(98, 25, 'pc', 26, 3, '2026-01-15 08:43:57.697339', '2026-01-15 08:44:27.697339', '2026-01-15 08:44:34.165158'),
	(99, 25, 'pc', 26, 3, '2026-01-15 08:44:34.235368', '2026-01-15 08:45:04.235368', '2026-01-15 08:45:45.392206'),
	(100, 25, 'pc', 26, 3, '2026-01-15 08:45:45.461717', '2026-01-15 08:46:15.461717', '2026-01-15 09:28:43.371279'),
	(101, 25, 'pc', 62, 3, '2026-01-15 08:45:51.658963', '2026-01-15 08:46:21.658963', '2026-01-15 09:28:43.371279'),
	(102, 25, 'pc', 26, 3, '2026-01-15 09:28:47.017182', '2026-01-15 09:29:17.017182', '2026-01-15 09:29:58.970474'),
	(103, 25, 'pc', 26, 3, '2026-01-15 09:30:02.219614', '2026-01-15 09:30:32.219614', '2026-01-15 09:38:56.757149'),
	(104, 25, 'pc', 26, 3, '2026-01-15 09:38:59.949224', '2026-01-15 09:39:29.949224', '2026-01-15 09:44:46.482333'),
	(105, 25, 'pc', 26, 3, '2026-01-15 09:44:58.928874', '2026-01-15 09:45:28.928874', '2026-01-15 10:15:53.607523'),
	(106, 25, 'pc', 26, 3, '2026-01-15 10:15:56.956638', '2026-01-15 10:16:26.956638', '2026-01-15 10:16:39.800342'),
	(107, 25, 'pc', 62, 3, '2026-01-15 10:16:39.874126', '2026-01-15 10:17:09.874126', '2026-01-15 10:17:24.123899'),
	(108, 25, 'npc', 1222, 3, '2026-01-15 10:17:29.141724', '2026-01-15 10:17:59.141724', '2026-01-15 10:20:24.790878'),
	(109, 25, 'npc', 1221, 3, '2026-01-15 10:17:33.912111', '2026-01-15 10:18:03.912111', '2026-01-15 10:20:24.790878'),
	(110, 25, 'pc', 26, 3, '2026-01-15 10:17:37.170660', '2026-01-15 10:18:07.170660', '2026-01-15 10:20:24.790878'),
	(111, 25, 'npc', 1222, 3, '2026-01-15 10:20:24.863825', '2026-01-15 10:20:54.863825', '2026-01-15 10:30:44.575701'),
	(112, 25, 'npc', 1221, 3, '2026-01-15 10:20:27.837988', '2026-01-15 10:20:57.837988', '2026-01-15 10:30:44.575701'),
	(113, 25, 'pc', 26, 3, '2026-01-15 11:04:11.011605', '2026-01-15 11:04:41.011605', '2026-01-15 11:21:29.303497'),
	(114, 25, 'npc', 1222, 3, '2026-01-15 14:31:21.640930', '2026-01-15 14:31:51.640930', '2026-01-15 14:32:02.688248'),
	(115, 25, 'npc', 1221, 3, '2026-01-15 14:31:26.113689', '2026-01-15 14:31:56.113689', '2026-01-15 14:32:02.688248'),
	(116, 25, 'npc', 1222, 3, '2026-01-15 14:32:02.766155', '2026-01-15 14:32:32.766155', '2026-01-15 14:32:55.371592'),
	(117, 25, 'pc', 62, 3, '2026-01-15 14:32:07.103230', '2026-01-15 14:32:37.103230', '2026-01-15 14:32:55.371592'),
	(118, 25, 'pc', 24, 3, '2026-01-15 14:32:23.296628', '2026-01-15 14:32:53.296628', '2026-01-15 14:32:55.371592'),
	(119, 25, 'pc', 23, 3, '2026-01-15 14:32:31.046722', '2026-01-15 14:33:01.046722', '2026-01-16 09:28:25.549002'),
	(120, 25, 'pc', 23, 3, '2026-01-16 09:28:29.867157', '2026-01-16 09:28:59.867157', '2026-01-16 09:29:02.241560'),
	(121, 25, 'pc', 26, 3, '2026-01-16 09:28:45.747670', '2026-01-16 09:29:15.747670', '2026-01-16 09:29:15.776353'),
	(122, 25, 'pc', 24, 3, '2026-01-16 09:29:14.417184', '2026-01-16 09:29:44.417184', '2026-01-16 09:31:06.363930'),
	(123, 25, 'pc', 26, 3, '2026-01-16 09:31:20.692844', '2026-01-16 09:31:50.692844', '2026-01-16 09:38:41.732818'),
	(124, 25, 'npc', 1222, 3, '2026-01-16 09:38:45.812455', '2026-01-16 09:39:15.812455', '2026-01-16 09:39:51.001997'),
	(125, 25, 'pc', 23, 3, '2026-01-16 09:40:58.952889', '2026-01-16 09:41:28.952889', '2026-01-16 09:41:32.247616'),
	(126, 25, 'npc', 1221, 3, '2026-01-16 09:43:48.760024', '2026-01-16 09:44:18.760024', '2026-01-16 09:44:20.188174'),
	(127, 25, 'pc', 68, 3, '2026-01-16 09:44:20.260538', '2026-01-16 09:44:50.260538', '2026-01-16 10:02:17.720029'),
	(128, 25, 'pc', 68, 3, '2026-01-16 10:02:21.439694', '2026-01-16 10:02:51.439694', '2026-01-16 10:02:55.543714'),
	(129, 25, 'pc', 68, 3, '2026-01-16 10:03:01.964301', '2026-01-16 10:03:31.964301', '2026-01-16 10:03:37.509911'),
	(130, 25, 'pc', 23, 3, '2026-01-16 10:03:13.168982', '2026-01-16 10:03:43.168982', '2026-01-16 10:03:45.714156'),
	(131, 25, 'pc', 68, 3, '2026-01-16 10:03:45.779428', '2026-01-16 10:04:15.779428', '2026-01-16 10:05:07.987131'),
	(132, 25, 'pc', 68, 3, '2026-01-16 10:05:08.064147', '2026-01-16 10:05:38.064147', '2026-01-16 10:05:53.442676'),
	(133, 25, 'npc', 1222, 3, '2026-01-16 10:05:56.873767', '2026-01-16 10:06:26.873767', '2026-01-16 10:06:55.775131'),
	(134, 25, 'pc', 68, 3, '2026-01-16 10:06:59.702582', '2026-01-16 10:07:29.702582', '2026-01-16 10:07:39.373754'),
	(135, 25, 'pc', 68, 3, '2026-01-16 10:07:42.645358', '2026-01-16 10:08:12.645358', '2026-01-16 10:08:53.073813'),
	(136, 25, 'npc', 1223, 3, '2026-01-16 10:08:56.866910', '2026-01-16 10:09:26.866910', '2026-01-16 10:09:32.040179'),
	(137, 25, 'npc', 1223, 3, '2026-01-16 10:09:35.507340', '2026-01-16 10:10:05.507340', '2026-01-16 10:29:08.022077'),
	(138, 25, 'pc', 26, 3, '2026-01-16 10:29:11.796026', '2026-01-16 10:29:41.796026', '2026-01-16 10:29:51.654829'),
	(139, 25, 'npc', 1222, 3, '2026-01-16 10:29:19.185071', '2026-01-16 10:29:49.185071', '2026-01-16 10:29:51.654829'),
	(140, 25, 'npc', 1222, 3, '2026-01-16 10:29:51.737382', '2026-01-16 10:30:21.737382', '2026-01-16 10:33:25.447344'),
	(141, 25, 'npc', 1223, 3, '2026-01-16 10:33:25.525185', '2026-01-16 10:33:55.525185', '2026-01-16 10:40:50.547653'),
	(142, 25, 'npc', 1222, 3, '2026-01-16 10:40:54.169104', '2026-01-16 10:41:24.169104', '2026-01-16 10:50:07.306056'),
	(143, 25, 'npc', 1222, 3, '2026-01-16 10:50:38.805149', '2026-01-16 10:51:08.805149', '2026-01-16 10:56:00.894481'),
	(144, 25, 'npc', 1222, 3, '2026-01-16 10:56:04.562287', '2026-01-16 10:56:34.562287', '2026-01-16 10:56:38.562358'),
	(145, 25, 'npc', 1225, 3, '2026-01-16 10:56:38.641870', '2026-01-16 10:57:08.641870', '2026-01-16 10:58:57.514769'),
	(146, 25, 'npc', 1225, 3, '2026-01-16 10:59:02.453493', '2026-01-16 10:59:32.453493', '2026-01-16 11:00:25.987980'),
	(147, 25, 'npc', 1223, 3, '2026-01-16 11:01:35.921144', '2026-01-16 11:02:05.921144', '2026-01-16 11:02:23.667913'),
	(148, 25, 'npc', 1225, 3, '2026-01-16 11:02:27.476560', '2026-01-16 11:02:57.476560', '2026-01-16 11:03:32.319741'),
	(149, 25, 'npc', 1219, 3, '2026-01-16 11:02:31.594993', '2026-01-16 11:03:01.594993', '2026-01-16 11:03:32.319741'),
	(150, 25, 'npc', 1222, 3, '2026-01-16 11:02:53.425961', '2026-01-16 11:03:23.425961', '2026-01-16 11:03:32.319741'),
	(151, 25, 'npc', 1222, 3, '2026-01-16 11:03:36.071679', '2026-01-16 11:04:06.071679', '2026-01-16 11:04:37.057323'),
	(152, 25, 'npc', 1221, 3, '2026-01-16 11:03:40.541622', '2026-01-16 11:04:10.541622', '2026-01-16 11:04:37.057323'),
	(153, 25, 'pc', 62, 3, '2026-01-16 11:08:29.836212', '2026-01-16 11:08:59.836212', '2026-01-16 11:09:24.145455'),
	(154, 25, 'npc', 1225, 3, '2026-01-16 11:08:33.099757', '2026-01-16 11:09:03.099757', '2026-01-16 11:09:24.145455'),
	(155, 25, 'pc', 24, 3, '2026-01-16 11:08:37.682428', '2026-01-16 11:09:07.682428', '2026-01-16 11:09:24.145455'),
	(156, 25, 'npc', 1223, 3, '2026-01-16 11:08:41.126287', '2026-01-16 11:09:11.126287', '2026-01-16 11:09:24.145455'),
	(157, 25, 'pc', 62, 3, '2026-01-16 11:09:27.429867', '2026-01-16 11:09:57.429867', '2026-01-16 11:10:26.498499'),
	(158, 25, 'npc', 1225, 3, '2026-01-16 11:09:29.873954', '2026-01-16 11:09:59.873954', '2026-01-16 11:10:26.498499'),
	(159, 25, 'pc', 24, 3, '2026-01-16 11:09:33.445703', '2026-01-16 11:10:03.445703', '2026-01-16 11:10:26.498499'),
	(160, 25, 'pc', 62, 3, '2026-01-16 11:11:13.938977', '2026-01-16 11:11:43.938977', '2026-01-16 11:13:06.269871'),
	(161, 25, 'pc', 24, 3, '2026-01-16 11:13:09.650074', '2026-01-16 11:13:39.650074', '2026-01-16 11:14:09.148328'),
	(162, 25, 'pc', 62, 3, '2026-01-16 11:14:13.516498', '2026-01-16 11:14:43.516498', '2026-01-16 11:17:03.434147'),
	(163, 25, 'pc', 24, 3, '2026-01-16 11:18:46.978977', '2026-01-16 11:19:16.978977', '2026-01-16 11:20:08.700925'),
	(164, 25, 'pc', 24, 3, '2026-01-16 11:38:31.455442', '2026-01-16 11:39:01.455442', '2026-01-16 11:41:28.831106'),
	(165, 25, 'pc', 24, 3, '2026-01-16 11:41:32.601479', '2026-01-16 11:42:02.601479', '2026-01-16 11:42:32.645095'),
	(166, 25, 'pc', 62, 3, '2026-01-16 11:42:36.357741', '2026-01-16 11:43:06.357741', '2026-01-16 11:43:18.933572'),
	(167, 25, 'pc', 62, 3, '2026-01-16 11:46:49.935813', '2026-01-16 11:47:19.935813', '2026-01-16 11:47:36.037837'),
	(168, 25, 'pc', 24, 3, '2026-01-16 11:46:57.087878', '2026-01-16 11:47:27.087878', '2026-01-16 11:47:36.037837'),
	(169, 25, 'npc', 1225, 3, '2026-01-16 11:47:36.102164', '2026-01-16 11:48:06.102164', '2026-01-16 11:49:15.695168'),
	(170, 25, 'pc', 24, 3, '2026-01-16 11:49:20.196990', '2026-01-16 11:49:50.196990', '2026-01-16 11:49:57.742490'),
	(171, 25, 'npc', 1225, 3, '2026-01-16 11:49:57.832401', '2026-01-16 11:50:27.832401', '2026-01-16 11:51:27.767056'),
	(172, 25, 'npc', 1225, 3, '2026-01-16 11:51:32.359925', '2026-01-16 11:52:02.359925', '2026-01-16 11:54:40.407704'),
	(173, 25, 'pc', 62, 3, '2026-01-16 11:54:45.240005', '2026-01-16 11:55:15.240005', '2026-01-16 12:06:51.961065'),
	(174, 25, 'pc', 24, 3, '2026-01-16 11:54:48.280053', '2026-01-16 11:55:18.280053', '2026-01-16 12:06:51.961065'),
	(175, 25, 'npc', 1225, 3, '2026-01-16 11:54:51.928094', '2026-01-16 11:55:21.928094', '2026-01-16 12:06:51.961065'),
	(176, 25, 'npc', 1223, 3, '2026-01-16 11:54:54.790761', '2026-01-16 11:55:24.790761', '2026-01-16 12:06:51.961065'),
	(177, 25, 'pc', 68, 3, '2026-01-16 12:14:02.456535', '2026-01-16 12:14:32.456535', '2026-01-16 12:25:47.190016'),
	(178, 25, 'pc', 24, 3, '2026-01-18 08:18:55.685726', '2026-01-18 08:19:25.685726', '2026-01-18 09:58:14.021312'),
	(179, 25, 'pc', 23, 3, '2026-01-18 10:09:10.001134', '2026-01-18 10:09:40.001134', '2026-01-18 10:25:04.387962'),
	(180, 25, 'pc', 62, 3, '2026-01-18 10:25:09.303195', '2026-01-18 10:25:39.303195', '2026-01-18 10:26:38.180252'),
	(181, 25, 'pc', 23, 3, '2026-01-18 10:26:38.273497', '2026-01-18 10:27:08.273497', '2026-01-18 10:27:22.202074'),
	(182, 25, 'pc', 23, 3, '2026-01-18 10:27:22.272476', '2026-01-18 10:27:52.272476', '2026-01-18 10:55:13.204348'),
	(183, 25, 'pc', 24, 3, '2026-01-18 10:55:36.480910', '2026-01-18 10:56:06.480910', '2026-01-18 10:56:13.230015'),
	(184, 25, 'pc', 62, 3, '2026-01-18 10:56:16.952493', '2026-01-18 10:56:46.952493', '2026-01-18 11:08:09.797301'),
	(185, 25, 'pc', 68, 3, '2026-01-18 10:56:32.352043', '2026-01-18 10:57:02.352043', '2026-01-18 11:08:09.797301'),
	(186, 25, 'pc', 62, 3, '2026-01-18 11:08:09.891941', '2026-01-18 11:08:39.891941', '2026-01-18 11:08:45.027123'),
	(187, 25, 'pc', 62, 3, '2026-01-18 11:08:48.907596', '2026-01-18 11:09:18.907596', '2026-01-18 11:24:52.589275'),
	(188, 25, 'pc', 23, 3, '2026-01-18 11:08:54.883482', '2026-01-18 11:09:24.883482', '2026-01-18 11:24:52.589275'),
	(189, 25, 'pc', 68, 3, '2026-01-18 11:25:06.841367', '2026-01-18 11:25:36.841367', '2026-01-18 11:31:35.376397'),
	(190, 25, 'pc', 62, 3, '2026-01-18 11:31:35.448489', '2026-01-18 11:32:05.448489', '2026-01-18 11:32:27.357212'),
	(191, 25, 'pc', 24, 3, '2026-01-18 11:31:38.779841', '2026-01-18 11:32:08.779841', '2026-01-18 11:32:27.357212'),
	(192, 25, 'npc', 1223, 3, '2026-01-18 11:31:42.368143', '2026-01-18 11:32:12.368143', '2026-01-18 11:32:27.357212'),
	(193, 25, 'pc', 23, 3, '2026-01-18 11:57:14.667463', '2026-01-18 11:57:44.667463', '2026-01-18 11:58:12.434098'),
	(194, 25, 'pc', 24, 3, '2026-01-18 11:57:17.783028', '2026-01-18 11:57:47.783028', '2026-01-18 11:58:12.434098'),
	(195, 25, 'pc', 62, 3, '2026-01-18 11:57:20.344453', '2026-01-18 11:57:50.344453', '2026-01-18 11:58:12.434098'),
	(196, 25, 'npc', 1223, 3, '2026-01-18 11:57:23.896412', '2026-01-18 11:57:53.896412', '2026-01-18 11:58:12.434098'),
	(197, 25, 'pc', 68, 3, '2026-01-18 11:57:27.442275', '2026-01-18 11:57:57.442275', '2026-01-18 11:58:12.434098'),
	(198, 25, 'npc', 1219, 3, '2026-01-18 11:57:31.352609', '2026-01-18 11:58:01.352609', '2026-01-18 11:58:12.434098'),
	(199, 25, 'pc', 26, 3, '2026-01-18 11:57:34.644296', '2026-01-18 11:58:04.644296', '2026-01-18 11:58:12.434098'),
	(200, 25, 'npc', 1222, 3, '2026-01-18 11:57:39.976152', '2026-01-18 11:58:09.976152', '2026-01-18 11:58:12.434098'),
	(201, 25, 'npc', 1221, 3, '2026-01-18 11:58:12.504222', '2026-01-18 11:58:42.504222', '2026-01-18 12:01:37.749661'),
	(202, 25, 'npc', 1222, 3, '2026-01-18 11:58:15.644278', '2026-01-18 11:58:45.644278', '2026-01-18 12:01:37.749661'),
	(203, 25, 'pc', 23, 3, '2026-01-18 12:16:57.769886', '2026-01-18 12:17:27.769886', '2026-01-18 12:16:59.300624'),
	(204, 25, 'pc', 23, 3, '2026-01-18 12:16:59.300624', '2026-01-18 12:17:29.300624', '2026-01-18 12:17:30.154885'),
	(205, 25, 'pc', 24, 3, '2026-01-18 12:17:30.219129', '2026-01-18 12:18:00.219129', '2026-01-18 12:19:16.674736'),
	(206, 25, 'pc', 24, 3, '2026-01-18 12:19:28.699817', '2026-01-18 12:19:58.699817', '2026-01-18 12:22:42.847629'),
	(207, 25, 'pc', 68, 3, '2026-01-18 12:22:46.469667', '2026-01-18 12:23:16.469667', '2026-01-18 12:24:28.738677'),
	(208, 25, 'pc', 24, 3, '2026-01-18 12:22:50.840823', '2026-01-18 12:23:20.840823', '2026-01-18 12:24:28.738677'),
	(209, 25, 'pc', 24, 3, '2026-01-18 13:58:53.460917', '2026-01-18 13:59:23.460917', '2026-01-18 13:59:31.978480'),
	(210, 25, 'pc', 23, 3, '2026-01-18 13:59:01.175663', '2026-01-18 13:59:31.175663', '2026-01-18 13:59:31.978480'),
	(211, 25, 'pc', 62, 3, '2026-01-18 13:59:32.052287', '2026-01-18 14:00:02.052287', '2026-01-18 14:00:40.313607'),
	(212, 25, 'pc', 23, 3, '2026-01-18 13:59:43.037893', '2026-01-18 14:00:13.037893', '2026-01-18 14:00:40.313607'),
	(213, 25, 'pc', 68, 3, '2026-01-18 13:59:47.643896', '2026-01-18 14:00:17.643896', '2026-01-18 14:00:40.313607'),
	(214, 25, 'pc', 68, 3, '2026-01-20 09:46:20.109429', '2026-01-20 09:46:50.109429', '2026-01-20 09:47:35.154408'),
	(215, 25, 'npc', 1223, 3, '2026-01-20 09:46:23.504388', '2026-01-20 09:46:53.504388', '2026-01-20 09:47:35.154408'),
	(216, 25, 'pc', 68, 3, '2026-01-20 09:47:41.979528', '2026-01-20 09:48:11.979528', '2026-01-20 09:48:26.812455'),
	(217, 25, 'npc', 1223, 3, '2026-01-20 09:47:45.480055', '2026-01-20 09:48:15.480055', '2026-01-20 09:48:26.812455'),
	(218, 25, 'npc', 1223, 3, '2026-01-20 09:48:30.056560', '2026-01-20 09:49:00.056560', '2026-01-20 10:32:06.687548'),
	(219, 25, 'pc', 68, 3, '2026-01-20 12:56:55.197500', '2026-01-20 12:57:25.197500', '2026-01-20 13:05:13.179527'),
	(220, 25, 'pc', 68, 3, '2026-01-20 13:20:03.082214', '2026-01-20 13:20:33.082214', '2026-01-20 13:21:39.153213'),
	(221, 25, 'pc', 68, 3, '2026-01-20 13:35:51.055163', '2026-01-20 13:36:21.055163', '2026-01-20 13:36:42.388054'),
	(222, 25, 'pc', 23, 3, '2026-01-20 13:36:20.200402', '2026-01-20 13:36:50.200402', '2026-01-20 13:40:11.046773'),
	(223, 25, 'pc', 68, 3, '2026-01-20 13:52:25.052652', '2026-01-20 13:52:55.052652', '2026-01-20 13:54:21.572155'),
	(224, 25, 'pc', 24, 3, '2026-01-20 13:54:27.074089', '2026-01-20 13:54:57.074089', '2026-01-20 13:55:29.027822'),
	(225, 25, 'npc', 1222, 3, '2026-01-20 13:56:13.578308', '2026-01-20 13:56:43.578308', '2026-01-20 13:57:11.038738'),
	(226, 25, 'pc', 24, 3, '2026-01-20 13:57:16.162047', '2026-01-20 13:57:46.162047', '2026-01-20 14:11:09.166654'),
	(227, 25, 'pc', 24, 3, '2026-01-20 14:11:14.295375', '2026-01-20 14:11:44.295375', '2026-01-20 14:12:59.854787'),
	(228, 25, 'pc', 24, 3, '2026-01-20 14:13:04.025996', '2026-01-20 14:13:34.025996', '2026-01-20 14:14:18.603068'),
	(229, 25, 'pc', 62, 3, '2026-01-20 14:13:17.333157', '2026-01-20 14:13:47.333157', '2026-01-20 14:14:18.603068'),
	(230, 25, 'pc', 24, 3, '2026-01-20 14:14:18.709675', '2026-01-20 14:14:48.709675', '2026-01-20 14:18:15.300280'),
	(231, 25, 'pc', 62, 3, '2026-01-20 14:14:39.091137', '2026-01-20 14:15:09.091137', '2026-01-20 14:18:15.300280'),
	(232, 25, 'pc', 68, 3, '2026-01-20 14:18:15.456113', '2026-01-20 14:18:45.456113', '2026-01-20 14:19:16.135744'),
	(233, 25, 'pc', 68, 3, '2026-01-20 14:19:20.834144', '2026-01-20 14:19:50.834144', '2026-01-20 14:20:43.826062'),
	(234, 25, 'pc', 24, 3, '2026-01-20 14:21:36.996859', '2026-01-20 14:22:06.996859', '2026-01-20 14:39:20.577152'),
	(235, 25, 'pc', 24, 3, '2026-01-20 14:44:34.841719', '2026-01-20 14:45:04.841719', '2026-01-20 14:47:57.290136'),
	(236, 25, 'pc', 23, 3, '2026-01-20 14:47:57.401233', '2026-01-20 14:48:27.401233', '2026-01-20 14:49:05.942848'),
	(237, 25, 'pc', 26, 3, '2026-01-20 14:48:02.435332', '2026-01-20 14:48:32.435332', '2026-01-20 14:49:05.942848'),
	(238, 25, 'pc', 26, 3, '2026-01-21 13:37:04.754248', '2026-01-21 13:37:34.754248', '2026-01-21 13:38:17.670510'),
	(239, 25, 'pc', 22, 3, '2026-01-21 13:59:00.630854', '2026-01-21 13:59:30.630854', '2026-01-21 14:09:09.456585'),
	(240, 25, 'npc', 1222, 3, '2026-01-21 14:53:04.755308', '2026-01-21 14:53:34.755308', NULL),
	(241, 25, 'npc', 1221, 3, '2026-01-21 14:53:23.521169', '2026-01-21 14:53:53.521169', NULL);
/*!40000 ALTER TABLE `core_scanintel` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_scanintelgroup
CREATE TABLE IF NOT EXISTS `core_scanintelgroup` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `group_id` bigint(20) NOT NULL,
  `scan_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_scanintelgroup_scan_id_group_id_f00ac4ee_uniq` (`scan_id`,`group_id`),
  KEY `core_scanin_group_i_391e91_idx` (`group_id`),
  CONSTRAINT `core_scanintelgroup_group_id_9b192607_fk_core_playergroup_id` FOREIGN KEY (`group_id`) REFERENCES `core_playergroup` (`id`),
  CONSTRAINT `core_scanintelgroup_scan_id_689e44a5_fk_core_scanintel_id` FOREIGN KEY (`scan_id`) REFERENCES `core_scanintel` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_scanintelgroup : ~0 rows (environ)
DELETE FROM `core_scanintelgroup`;
/*!40000 ALTER TABLE `core_scanintelgroup` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_scanintelgroup` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_sector
CREATE TABLE IF NOT EXISTS `core_sector` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `image` varchar(250) NOT NULL,
  `description` longtext NOT NULL,
  `is_faction_level_starter` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `faction_id` bigint(20) NOT NULL,
  `security_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_sector_security_id_e4ebc495_fk_core_security_id` (`security_id`),
  KEY `core_sector_faction_id_9699b15c_fk_core_faction_id` (`faction_id`),
  CONSTRAINT `core_sector_faction_id_9699b15c_fk_core_faction_id` FOREIGN KEY (`faction_id`) REFERENCES `core_faction` (`id`),
  CONSTRAINT `core_sector_security_id_e4ebc495_fk_core_security_id` FOREIGN KEY (`security_id`) REFERENCES `core_security` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_sector : ~3 rows (environ)
DELETE FROM `core_sector`;
/*!40000 ALTER TABLE `core_sector` DISABLE KEYS */;
INSERT INTO `core_sector` (`id`, `name`, `image`, `description`, `is_faction_level_starter`, `created_at`, `updated_at`, `faction_id`, `security_id`) VALUES
	(3, 'zone-transition', 'bg_space_5', 'bruh !', 1, '2025-03-12 17:41:04.227825', '2025-03-12 17:41:04.227825', 1, 2),
	(4, 'tuto_sector', 'bg_space_3', 'tutoriel sector', 1, '2025-05-22 13:39:42.129968', '2025-05-22 13:39:42.129968', 1, 1),
	(7, 'sector_1', 'bg_space_3', 'dfssdfsdfsdfsdf', 0, '2026-01-03 09:37:52.550723', '2026-01-03 09:37:52.552721', 2, 2);
/*!40000 ALTER TABLE `core_sector` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_sectorwarpzone
CREATE TABLE IF NOT EXISTS `core_sectorwarpzone` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `warp_destination_id` bigint(20) NOT NULL,
  `warp_home_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_sectorwarpzone_warp_destination_id_af6fa9f6_fk_core_warp` (`warp_destination_id`),
  KEY `core_sectorwarpzone_warp_home_id_72b32c95_fk_core_warpzone_id` (`warp_home_id`),
  CONSTRAINT `core_sectorwarpzone_warp_destination_id_af6fa9f6_fk_core_warp` FOREIGN KEY (`warp_destination_id`) REFERENCES `core_warpzone` (`id`),
  CONSTRAINT `core_sectorwarpzone_warp_home_id_72b32c95_fk_core_warpzone_id` FOREIGN KEY (`warp_home_id`) REFERENCES `core_warpzone` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_sectorwarpzone : ~2 rows (environ)
DELETE FROM `core_sectorwarpzone`;
/*!40000 ALTER TABLE `core_sectorwarpzone` DISABLE KEYS */;
INSERT INTO `core_sectorwarpzone` (`id`, `created_at`, `updated_at`, `warp_destination_id`, `warp_home_id`) VALUES
	(50, '2026-01-08 21:32:28.269376', '2026-01-08 21:32:28.270375', 12, 5),
	(51, '2026-01-08 21:32:45.829257', '2026-01-08 21:32:45.831254', 13, 12),
	(52, '2026-01-08 21:32:45.842254', '2026-01-08 21:32:45.842254', 12, 13);
/*!40000 ALTER TABLE `core_sectorwarpzone` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_security
CREATE TABLE IF NOT EXISTS `core_security` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `attack_countdown` smallint(5) unsigned NOT NULL,
  `chance_to_intervene` smallint(5) unsigned NOT NULL,
  `ship_quantity` smallint(5) unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_security : ~4 rows (environ)
DELETE FROM `core_security`;
/*!40000 ALTER TABLE `core_security` DISABLE KEYS */;
INSERT INTO `core_security` (`id`, `name`, `description`, `attack_countdown`, `chance_to_intervene`, `ship_quantity`, `created_at`, `updated_at`) VALUES
	(1, 'null', 'Beware, you are in an unsafe area. You could be attacked at any time, you\'re on your own.', 0, 0, 0, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(2, 'low', 'Be careful, security is poor in this area and the authorities will find it difficult to defend you.', 3, 33, 1, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(3, 'intermediate', 'It\'s not a highly secure area, but it\'s not a lawless one either, so just be careful.', 2, 66, 2, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(4, 'high', 'Here you are safe and secure, with security forces on call at all times and at very short notice.', 1, 100, 3, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000');
/*!40000 ALTER TABLE `core_security` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_ship
CREATE TABLE IF NOT EXISTS `core_ship` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `image` varchar(250) NOT NULL,
  `module_slot_available` int(10) unsigned NOT NULL,
  `default_hp` smallint(5) unsigned NOT NULL,
  `default_movement` smallint(5) unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `ship_category_id` bigint(20) DEFAULT NULL,
  `default_ballistic_defense` smallint(5) unsigned NOT NULL,
  `default_missile_defense` smallint(5) unsigned NOT NULL,
  `default_thermal_defense` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_ship_ship_category_id_cb2c88f5_fk_core_shipcategory_id` (`ship_category_id`),
  CONSTRAINT `core_ship_ship_category_id_cb2c88f5_fk_core_shipcategory_id` FOREIGN KEY (`ship_category_id`) REFERENCES `core_shipcategory` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_ship : ~8 rows (environ)
DELETE FROM `core_ship`;
/*!40000 ALTER TABLE `core_ship` DISABLE KEYS */;
INSERT INTO `core_ship` (`id`, `name`, `description`, `image`, `module_slot_available`, `default_hp`, `default_movement`, `created_at`, `updated_at`, `ship_category_id`, `default_ballistic_defense`, `default_missile_defense`, `default_thermal_defense`) VALUES
	(1, 'AstralTech Scout MK I', 'lorem ipsum bla bla bla', 'light_1', 8, 25, 30, '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 1, 15, 10, 15),
	(2, 'Pioneer Gatherer MK I', 'lorem ipsum bla bla bla', 'light_10', 8, 25, 30, '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 1, 15, 15, 10),
	(3, 'BioTech RSRCH MK I', 'lorem ipsum bla bla bla', 'light_3', 8, 25, 30, '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 1, 10, 15, 15),
	(4, 'BioTech RSRCH MK VII', 'lorem ipsum bla bla bla', 'super_heavy_4', 14, 125, 15, '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 4, 50, 55, 55),
	(5, 'SG Raptor', 'lorem ipsum bla bla bla', 'medium_14', 10, 35, 25, '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 2, 15, 25, 25),
	(6, 'SG Vulture', 'lorem ipsum bla bla bla', 'heavy_12', 12, 45, 20, '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 3, 20, 35, 35),
	(7, 'SG raider', 'lorem ipsum...', 'light_5', 10, 100, 10, '2026-01-06 12:15:02.000000', '2026-01-06 12:18:17.642239', 1, 5, 5, 10),
	(8, 'Pioneer Observer', 'lorem ipsum bla bli blou', 'light_2', 5, 35, 10, '2026-01-06 12:18:42.000000', '2026-01-06 12:22:12.817106', 1, 5, 5, 5);
/*!40000 ALTER TABLE `core_ship` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_shipcategory
CREATE TABLE IF NOT EXISTS `core_shipcategory` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `size` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `ship_category_hp` int(11) NOT NULL,
  `ship_category_movement` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_shipcategory : ~4 rows (environ)
DELETE FROM `core_shipcategory`;
/*!40000 ALTER TABLE `core_shipcategory` DISABLE KEYS */;
INSERT INTO `core_shipcategory` (`id`, `name`, `description`, `size`, `created_at`, `updated_at`, `ship_category_hp`, `ship_category_movement`) VALUES
	(1, 'Light', 'lorem ipsum bla bla bla', '{"x": 1, "y": 1}', '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 0, 0),
	(2, 'Medium', 'lorem ipsum bla bla bla', '{"x": 2, "y": 1}', '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 0, 0),
	(3, 'Heavy', 'lorem ipsum bla bla bla', '{"x": 3, "y": 2}', '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 0, 0),
	(4, 'Super heavy', 'lorem ipsum bla bla bla', '{"x": 3, "y": 3}', '2020-04-22 12:38:15.000000', '2020-04-22 12:38:15.000000', 0, 0);
/*!40000 ALTER TABLE `core_shipcategory` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_shipmodulelimitation
CREATE TABLE IF NOT EXISTS `core_shipmodulelimitation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `defense_module_limitation` smallint(5) unsigned NOT NULL,
  `weaponry_module_limitation` smallint(5) unsigned NOT NULL,
  `hold_module_limitation` smallint(5) unsigned NOT NULL,
  `movement_module_limitation` smallint(5) unsigned NOT NULL,
  `hull_module_limitation` smallint(5) unsigned NOT NULL,
  `repair_module_limitation` smallint(5) unsigned NOT NULL,
  `gathering_module_limitation` smallint(5) unsigned NOT NULL,
  `craft_module_limitation` smallint(5) unsigned NOT NULL,
  `research_module_limitation` smallint(5) unsigned NOT NULL,
  `electronic_warfare_module_limitation` smallint(5) unsigned NOT NULL,
  `colonization_module_limitation` smallint(5) unsigned NOT NULL,
  `ship_id` bigint(20) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_shipmodulelimitation_ship_id_8390cb01_fk_core_ship_id` (`ship_id`),
  CONSTRAINT `core_shipmodulelimitation_ship_id_8390cb01_fk_core_ship_id` FOREIGN KEY (`ship_id`) REFERENCES `core_ship` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_shipmodulelimitation : ~6 rows (environ)
DELETE FROM `core_shipmodulelimitation`;
/*!40000 ALTER TABLE `core_shipmodulelimitation` DISABLE KEYS */;
INSERT INTO `core_shipmodulelimitation` (`id`, `defense_module_limitation`, `weaponry_module_limitation`, `hold_module_limitation`, `movement_module_limitation`, `hull_module_limitation`, `repair_module_limitation`, `gathering_module_limitation`, `craft_module_limitation`, `research_module_limitation`, `electronic_warfare_module_limitation`, `colonization_module_limitation`, `ship_id`, `created_at`, `updated_at`) VALUES
	(1, 3, 2, 1, 3, 1, 1, 2, 1, 1, 3, 0, 1, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(2, 3, 1, 2, 2, 1, 1, 2, 2, 2, 1, 0, 2, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(3, 3, 1, 2, 3, 2, 3, 1, 1, 1, 1, 0, 3, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(4, 6, 4, 3, 2, 3, 2, 0, 0, 0, 2, 1, 4, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(5, 3, 3, 2, 2, 2, 1, 0, 0, 0, 1, 0, 5, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(6, 4, 4, 3, 2, 3, 0, 0, 0, 0, 2, 0, 6, '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000');
/*!40000 ALTER TABLE `core_shipmodulelimitation` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_skill
CREATE TABLE IF NOT EXISTS `core_skill` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` longtext NOT NULL,
  `category` varchar(30) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_skill : ~23 rows (environ)
DELETE FROM `core_skill`;
/*!40000 ALTER TABLE `core_skill` DISABLE KEYS */;
INSERT INTO `core_skill` (`id`, `name`, `description`, `category`, `created_at`, `updated_at`) VALUES
	(1, 'Frigate', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Steering', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(2, 'Destroyer', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Steering', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(3, 'Battlecruiser', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Steering', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(4, 'Dreadnought', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Steering', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(5, 'Thermal Weapon', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Offensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(6, 'Ballistic Weapon', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Offensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(7, 'Missile Weapon', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Offensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(8, 'Electronic Warfare', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Offensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(9, 'Evasive maneuver', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Defensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(10, 'Thermal Shield', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Defensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(11, 'Ballistic Shield', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Defensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(12, 'Missile Shield', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Defensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(13, 'Counter Electronic Warfare', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Defensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(14, 'Repaire', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Utility', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(15, 'Shield Amelioration', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Utility', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(16, 'Hide Signature', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Utility', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(17, 'Detection', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Utility', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(18, 'Mining', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Industry', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(19, 'Refining', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Industry', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(20, 'Crafting', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Industry', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(21, 'Research', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Industry', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(22, 'Planetary Exploitation', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Industry', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000'),
	(23, 'Sharpshooting', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum', 'Offensive', '2020-03-21 12:38:15.000000', '2020-03-21 12:38:15.000000');
/*!40000 ALTER TABLE `core_skill` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_skilleffect
CREATE TABLE IF NOT EXISTS `core_skilleffect` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `min_level_range` int(10) unsigned NOT NULL,
  `max_level_range` int(10) unsigned NOT NULL,
  `effect` json DEFAULT NULL,
  `expertise` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `skill_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_skilleffect_skill_id_3e056554_fk_core_skill_id` (`skill_id`),
  CONSTRAINT `core_skilleffect_skill_id_3e056554_fk_core_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `core_skill` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_skilleffect : ~0 rows (environ)
DELETE FROM `core_skilleffect`;
/*!40000 ALTER TABLE `core_skilleffect` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_skilleffect` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_skillexperience
CREATE TABLE IF NOT EXISTS `core_skillexperience` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `level` smallint(5) unsigned NOT NULL,
  `required_experience` smallint(5) unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_skillexperience : ~100 rows (environ)
DELETE FROM `core_skillexperience`;
/*!40000 ALTER TABLE `core_skillexperience` DISABLE KEYS */;
INSERT INTO `core_skillexperience` (`id`, `level`, `required_experience`, `created_at`, `updated_at`) VALUES
	(1, 0, 0, '2025-05-27 06:29:32.218667', '2025-05-27 06:29:32.218667'),
	(2, 1, 25, '2025-05-27 06:29:32.231446', '2025-05-27 06:29:32.231446'),
	(3, 2, 50, '2025-05-27 06:29:32.258602', '2025-05-27 06:29:32.259138'),
	(4, 3, 75, '2025-05-27 06:29:32.291290', '2025-05-27 06:29:32.292291'),
	(5, 4, 100, '2025-05-27 06:29:32.332608', '2025-05-27 06:29:32.332608'),
	(6, 5, 125, '2025-05-27 06:29:32.347715', '2025-05-27 06:29:32.347715'),
	(7, 6, 150, '2025-05-27 06:29:32.366149', '2025-05-27 06:29:32.366682'),
	(8, 7, 175, '2025-05-27 06:29:32.380494', '2025-05-27 06:29:32.381026'),
	(9, 8, 200, '2025-05-27 06:29:32.399461', '2025-05-27 06:29:32.399461'),
	(10, 9, 225, '2025-05-27 06:29:32.413490', '2025-05-27 06:29:32.413490'),
	(11, 10, 250, '2025-05-27 06:29:32.432430', '2025-05-27 06:29:32.432430'),
	(12, 11, 275, '2025-05-27 06:29:32.445983', '2025-05-27 06:29:32.446986'),
	(13, 12, 300, '2025-05-27 06:29:32.465226', '2025-05-27 06:29:32.466226'),
	(14, 13, 325, '2025-05-27 06:29:32.479224', '2025-05-27 06:29:32.479224'),
	(15, 14, 350, '2025-05-27 06:29:32.498226', '2025-05-27 06:29:32.498226'),
	(16, 15, 375, '2025-05-27 06:29:32.512805', '2025-05-27 06:29:32.512805'),
	(17, 16, 400, '2025-05-27 06:29:32.531585', '2025-05-27 06:29:32.532111'),
	(18, 17, 425, '2025-05-27 06:29:32.545381', '2025-05-27 06:29:32.546383'),
	(19, 18, 450, '2025-05-27 06:29:32.564255', '2025-05-27 06:29:32.565254'),
	(20, 19, 475, '2025-05-27 06:29:32.578556', '2025-05-27 06:29:32.578556'),
	(21, 20, 500, '2025-05-27 06:29:32.597557', '2025-05-27 06:29:32.598559'),
	(22, 21, 525, '2025-05-27 06:29:32.611598', '2025-05-27 06:29:32.611598'),
	(23, 22, 550, '2025-05-27 06:29:32.631100', '2025-05-27 06:29:32.631100'),
	(24, 23, 575, '2025-05-27 06:29:32.653538', '2025-05-27 06:29:32.654068'),
	(25, 24, 600, '2025-05-27 06:29:32.672643', '2025-05-27 06:29:32.672643'),
	(26, 25, 625, '2025-05-27 06:29:32.686191', '2025-05-27 06:29:32.687190'),
	(27, 26, 650, '2025-05-27 06:29:32.705368', '2025-05-27 06:29:32.705368'),
	(28, 27, 675, '2025-05-27 06:29:32.719842', '2025-05-27 06:29:32.720367'),
	(29, 28, 700, '2025-05-27 06:29:32.738425', '2025-05-27 06:29:32.738425'),
	(30, 29, 725, '2025-05-27 06:29:32.753013', '2025-05-27 06:29:32.753013'),
	(31, 30, 750, '2025-05-27 06:29:32.772013', '2025-05-27 06:29:32.772013'),
	(32, 31, 775, '2025-05-27 06:29:32.786013', '2025-05-27 06:29:32.786013'),
	(33, 32, 800, '2025-05-27 06:29:32.805101', '2025-05-27 06:29:32.805101'),
	(34, 33, 825, '2025-05-27 06:29:32.819101', '2025-05-27 06:29:32.819101'),
	(35, 34, 850, '2025-05-27 06:29:32.838101', '2025-05-27 06:29:32.838101'),
	(36, 35, 875, '2025-05-27 06:29:32.852101', '2025-05-27 06:29:32.852101'),
	(37, 36, 900, '2025-05-27 06:29:32.871101', '2025-05-27 06:29:32.871101'),
	(38, 37, 925, '2025-05-27 06:29:32.885101', '2025-05-27 06:29:32.885101'),
	(39, 38, 950, '2025-05-27 06:29:32.904101', '2025-05-27 06:29:32.904101'),
	(40, 39, 975, '2025-05-27 06:29:32.918101', '2025-05-27 06:29:32.919101'),
	(41, 40, 1000, '2025-05-27 06:29:32.937110', '2025-05-27 06:29:32.937110'),
	(42, 41, 1025, '2025-05-27 06:29:32.951134', '2025-05-27 06:29:32.952134'),
	(43, 42, 1050, '2025-05-27 06:29:32.970649', '2025-05-27 06:29:32.970649'),
	(44, 43, 1075, '2025-05-27 06:29:32.984650', '2025-05-27 06:29:32.984650'),
	(45, 44, 1100, '2025-05-27 06:29:33.003228', '2025-05-27 06:29:33.003228'),
	(46, 45, 1125, '2025-05-27 06:29:33.018229', '2025-05-27 06:29:33.018229'),
	(47, 46, 1150, '2025-05-27 06:29:33.036228', '2025-05-27 06:29:33.037229'),
	(48, 47, 1175, '2025-05-27 06:29:33.059231', '2025-05-27 06:29:33.059231'),
	(49, 48, 1200, '2025-05-27 06:29:33.078338', '2025-05-27 06:29:33.078338'),
	(50, 49, 1225, '2025-05-27 06:29:33.092839', '2025-05-27 06:29:33.092839'),
	(51, 50, 1250, '2025-05-27 06:29:33.111395', '2025-05-27 06:29:33.111395'),
	(52, 51, 1275, '2025-05-27 06:29:33.125395', '2025-05-27 06:29:33.125395'),
	(53, 52, 1300, '2025-05-27 06:29:33.144395', '2025-05-27 06:29:33.144395'),
	(54, 53, 1325, '2025-05-27 06:29:33.158907', '2025-05-27 06:29:33.158907'),
	(55, 54, 1350, '2025-05-27 06:29:33.176907', '2025-05-27 06:29:33.177908'),
	(56, 55, 1375, '2025-05-27 06:29:33.191907', '2025-05-27 06:29:33.191907'),
	(57, 56, 1400, '2025-05-27 06:29:33.210476', '2025-05-27 06:29:33.210476'),
	(58, 57, 1425, '2025-05-27 06:29:33.224476', '2025-05-27 06:29:33.225476'),
	(59, 58, 1450, '2025-05-27 06:29:33.243476', '2025-05-27 06:29:33.243476'),
	(60, 59, 1475, '2025-05-27 06:29:33.257477', '2025-05-27 06:29:33.258477'),
	(61, 60, 1500, '2025-05-27 06:29:33.276477', '2025-05-27 06:29:33.276477'),
	(62, 61, 1525, '2025-05-27 06:29:33.291476', '2025-05-27 06:29:33.291476'),
	(63, 62, 1550, '2025-05-27 06:29:33.309477', '2025-05-27 06:29:33.310477'),
	(64, 63, 1575, '2025-05-27 06:29:33.324476', '2025-05-27 06:29:33.324476'),
	(65, 64, 1600, '2025-05-27 06:29:33.342476', '2025-05-27 06:29:33.343476'),
	(66, 65, 1625, '2025-05-27 06:29:33.357039', '2025-05-27 06:29:33.358037'),
	(67, 66, 1650, '2025-05-27 06:29:33.376037', '2025-05-27 06:29:33.376037'),
	(68, 67, 1675, '2025-05-27 06:29:33.390038', '2025-05-27 06:29:33.391038'),
	(69, 68, 1700, '2025-05-27 06:29:33.409634', '2025-05-27 06:29:33.409634'),
	(70, 69, 1725, '2025-05-27 06:29:33.423632', '2025-05-27 06:29:33.423632'),
	(71, 70, 1750, '2025-05-27 06:29:33.442633', '2025-05-27 06:29:33.442633'),
	(72, 71, 1775, '2025-05-27 06:29:33.456633', '2025-05-27 06:29:33.456633'),
	(73, 72, 1800, '2025-05-27 06:29:33.475633', '2025-05-27 06:29:33.475633'),
	(74, 73, 1825, '2025-05-27 06:29:33.489633', '2025-05-27 06:29:33.489633'),
	(75, 74, 1850, '2025-05-27 06:29:33.508633', '2025-05-27 06:29:33.508633'),
	(76, 75, 1875, '2025-05-27 06:29:33.531634', '2025-05-27 06:29:33.531634'),
	(77, 76, 1900, '2025-05-27 06:29:33.549635', '2025-05-27 06:29:33.550633'),
	(78, 77, 1925, '2025-05-27 06:29:33.564758', '2025-05-27 06:29:33.564758'),
	(79, 78, 1950, '2025-05-27 06:29:33.582758', '2025-05-27 06:29:33.582758'),
	(80, 79, 1975, '2025-05-27 06:29:33.597272', '2025-05-27 06:29:33.597272'),
	(81, 80, 2000, '2025-05-27 06:29:33.616348', '2025-05-27 06:29:33.616348'),
	(82, 81, 2025, '2025-05-27 06:29:33.630351', '2025-05-27 06:29:33.631350'),
	(83, 82, 2050, '2025-05-27 06:29:33.649350', '2025-05-27 06:29:33.649350'),
	(84, 83, 2075, '2025-05-27 06:29:33.663350', '2025-05-27 06:29:33.664350'),
	(85, 84, 2100, '2025-05-27 06:29:33.682350', '2025-05-27 06:29:33.682350'),
	(86, 85, 2125, '2025-05-27 06:29:33.696349', '2025-05-27 06:29:33.697350'),
	(87, 86, 2150, '2025-05-27 06:29:33.715348', '2025-05-27 06:29:33.715348'),
	(88, 87, 2175, '2025-05-27 06:29:33.730350', '2025-05-27 06:29:33.730350'),
	(89, 88, 2200, '2025-05-27 06:29:33.748350', '2025-05-27 06:29:33.749349'),
	(90, 89, 2225, '2025-05-27 06:29:33.763456', '2025-05-27 06:29:33.763456'),
	(91, 90, 2250, '2025-05-27 06:29:33.781455', '2025-05-27 06:29:33.782455'),
	(92, 91, 2275, '2025-05-27 06:29:33.796457', '2025-05-27 06:29:33.796457'),
	(93, 92, 2300, '2025-05-27 06:29:33.814565', '2025-05-27 06:29:33.815563'),
	(94, 93, 2325, '2025-05-27 06:29:33.829564', '2025-05-27 06:29:33.829564'),
	(95, 94, 2350, '2025-05-27 06:29:33.848564', '2025-05-27 06:29:33.848564'),
	(96, 95, 2375, '2025-05-27 06:29:33.862562', '2025-05-27 06:29:33.862562'),
	(97, 96, 2400, '2025-05-27 06:29:33.881563', '2025-05-27 06:29:33.881563'),
	(98, 97, 2425, '2025-05-27 06:29:33.895562', '2025-05-27 06:29:33.895562'),
	(99, 98, 2450, '2025-05-27 06:29:33.914563', '2025-05-27 06:29:33.914563'),
	(100, 99, 2475, '2025-05-27 06:29:33.928562', '2025-05-27 06:29:33.928562');
/*!40000 ALTER TABLE `core_skillexperience` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_station
CREATE TABLE IF NOT EXISTS `core_station` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `data` json DEFAULT NULL,
  `size` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_station : ~2 rows (environ)
DELETE FROM `core_station`;
/*!40000 ALTER TABLE `core_station` DISABLE KEYS */;
INSERT INTO `core_station` (`id`, `name`, `data`, `size`, `created_at`, `updated_at`) VALUES
	(1, 'station1test', '{"type": "station", "animation": "station1test"}', '{"x": 3, "y": 3}', '2026-01-02 23:15:11.690347', '2026-01-02 23:15:11.691347'),
	(2, 'station1test2', '{"type": "station", "animation": "station1test2"}', '{"x": 3, "y": 3}', '2026-01-03 09:26:21.221464', '2026-01-03 09:26:21.224465'),
	(3, 'station1test3', '{"type": "station", "animation": "station1test3"}', '{"x": 3, "y": 3}', '2026-01-03 19:51:41.775875', '2026-01-03 19:51:41.777876');
/*!40000 ALTER TABLE `core_station` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_stationresource
CREATE TABLE IF NOT EXISTS `core_stationresource` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `data` json DEFAULT NULL,
  `coordinates` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `resource_id` bigint(20) DEFAULT NULL,
  `sector_id` bigint(20) NOT NULL,
  `source_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_stationresource_resource_id_fd3a9619_fk_core_resource_id` (`resource_id`),
  KEY `core_stationresource_sector_id_52ef338b_fk_core_sector_id` (`sector_id`),
  KEY `core_stationresource_source_id_cee7679c_fk_core_station_id` (`source_id`),
  CONSTRAINT `core_stationresource_resource_id_fd3a9619_fk_core_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `core_resource` (`id`),
  CONSTRAINT `core_stationresource_sector_id_52ef338b_fk_core_sector_id` FOREIGN KEY (`sector_id`) REFERENCES `core_sector` (`id`),
  CONSTRAINT `core_stationresource_source_id_cee7679c_fk_core_station_id` FOREIGN KEY (`source_id`) REFERENCES `core_station` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_stationresource : ~1 rows (environ)
DELETE FROM `core_stationresource`;
/*!40000 ALTER TABLE `core_stationresource` DISABLE KEYS */;
INSERT INTO `core_stationresource` (`id`, `data`, `coordinates`, `created_at`, `updated_at`, `resource_id`, `sector_id`, `source_id`) VALUES
	(2, '{"name": "station-1-test", "description": "test mdr"}', '{"x": "14", "y": "13"}', '2026-01-08 15:24:59.937859', '2026-01-08 15:24:59.937859', 1, 7, 3);
/*!40000 ALTER TABLE `core_stationresource` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_userpurchase
CREATE TABLE IF NOT EXISTS `core_userpurchase` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_userpurchase : ~0 rows (environ)
DELETE FROM `core_userpurchase`;
/*!40000 ALTER TABLE `core_userpurchase` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_userpurchase` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_warp
CREATE TABLE IF NOT EXISTS `core_warp` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `data` json DEFAULT NULL,
  `size` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_warp : ~2 rows (environ)
DELETE FROM `core_warp`;
/*!40000 ALTER TABLE `core_warp` DISABLE KEYS */;
INSERT INTO `core_warp` (`id`, `name`, `data`, `size`, `created_at`, `updated_at`) VALUES
	(1, 'warpzone_1', '{"type": "warpzone", "animation": "warpzone_1"}', '{"x": 2, "y": 3}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000'),
	(2, 'warpzone_2', '{"type": "warpzone", "animation": "warpzone_2"}', '{"x": 2, "y": 3}', '2020-02-28 12:38:15.000000', '2020-02-28 12:38:15.000000');
/*!40000 ALTER TABLE `core_warp` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. core_warpzone
CREATE TABLE IF NOT EXISTS `core_warpzone` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `data` json DEFAULT NULL,
  `coordinates` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `sector_id` bigint(20) NOT NULL,
  `source_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_warpzone_sector_id_36f8bf3f_fk_core_sector_id` (`sector_id`),
  KEY `core_warpzone_source_id_9d99c6ef_fk_core_warp_id` (`source_id`),
  CONSTRAINT `core_warpzone_sector_id_36f8bf3f_fk_core_sector_id` FOREIGN KEY (`sector_id`) REFERENCES `core_sector` (`id`),
  CONSTRAINT `core_warpzone_source_id_9d99c6ef_fk_core_warp_id` FOREIGN KEY (`source_id`) REFERENCES `core_warp` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.core_warpzone : ~3 rows (environ)
DELETE FROM `core_warpzone`;
/*!40000 ALTER TABLE `core_warpzone` DISABLE KEYS */;
INSERT INTO `core_warpzone` (`id`, `data`, `coordinates`, `created_at`, `updated_at`, `sector_id`, `source_id`) VALUES
	(5, '{"name": "w-3", "description": "qsdqsdqsd"}', '{"x": "27", "y": "24"}', '2025-07-08 07:00:29.789515', '2025-07-08 07:00:29.790515', 4, 1),
	(12, '{"name": "w-1", "description": "qsdqdsqd"}', '{"x": "19", "y": "7"}', '2026-01-08 15:23:57.975017', '2026-01-08 15:23:57.975017', 3, 1),
	(13, '{"name": "w-11", "description": "qsdqsdqd"}', '{"x": "27", "y": "5"}', '2026-01-08 15:24:59.954091', '2026-01-08 15:24:59.955093', 7, 1);
/*!40000 ALTER TABLE `core_warpzone` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. django_admin_log
CREATE TABLE IF NOT EXISTS `django_admin_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.django_admin_log : ~58 rows (environ)
DELETE FROM `django_admin_log`;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
INSERT INTO `django_admin_log` (`id`, `action_time`, `object_id`, `object_repr`, `action_flag`, `change_message`, `content_type_id`, `user_id`) VALUES
	(1, '2025-11-18 14:22:45.497772', '91', '[URGENT] IMPORT A LIRE ! ([REC] Gibson)', 1, '[{"added": {}}]', 53, 34),
	(2, '2026-01-06 12:18:17.643213', '7', 'SG raider', 1, '[{"added": {}}]', 29, 34),
	(3, '2026-01-06 12:22:12.818107', '8', 'Pioneer Observer', 1, '[{"added": {}}]', 29, 34),
	(4, '2026-01-06 12:31:31.297460', '60', 'sdqdqd - (user:test152, test152) : Spy', 3, '', 16, 34),
	(5, '2026-01-06 12:31:31.320551', '59', 'kjhkjuhkju - (user:tt151, tt151) : Engineer', 3, '', 16, 34),
	(6, '2026-01-06 12:31:31.340551', '58', 'qsdqsdqsdqsd - (user:tt150, tt150) : Harvester', 3, '', 16, 34),
	(7, '2026-01-06 12:31:31.403552', '57', 'qsdqsdqsdq - (user:test145, test145) : Harvester', 3, '', 16, 34),
	(8, '2026-01-06 12:31:31.423180', '56', 'ddsqdqsd - (user:test144, test144) : Harvester', 3, '', 16, 34),
	(9, '2026-01-06 12:31:31.444180', '55', 'fdsfdfsdf - (user:test143, test143) : Harvester', 3, '', 16, 34),
	(10, '2026-01-06 12:31:31.465181', '54', 'qsdqsdd - (user:test142, test142) : Harvester', 3, '', 16, 34),
	(11, '2026-01-06 12:31:31.486332', '53', 'kog3 - (user:test141, test141) : Harvester', 3, '', 16, 34),
	(12, '2026-01-06 12:31:31.506489', '52', 'Test63 - (user:test63, test63) : Harvester', 3, '', 16, 34),
	(13, '2026-01-06 12:31:31.527590', '51', 'Kogliostro2 - (user:test62, test62) : Harvester', 3, '', 16, 34),
	(14, '2026-01-06 12:31:31.547574', '50', 'lolilol - (user:test59, test59) : Spy', 3, '', 16, 34),
	(15, '2026-01-06 12:31:31.568574', '49', 'RouxDoudou - (user:test58, test58) : Technician', 3, '', 16, 34),
	(16, '2026-01-06 12:31:31.589574', '48', 'qsdqdqdq - (user:test57, test57) : Soldier', 3, '', 16, 34),
	(17, '2026-01-06 12:31:31.610599', '47', 'Kogliostro - (user:test56, test56) : Soldier', 3, '', 16, 34),
	(18, '2026-01-06 12:36:13.192012', '41', 'qsdqdqsd', 3, '', 4, 34),
	(19, '2026-01-06 12:36:13.209010', '45', 'test141', 3, '', 4, 34),
	(20, '2026-01-06 12:36:13.231010', '46', 'test142', 3, '', 4, 34),
	(21, '2026-01-06 12:36:13.250664', '47', 'test143', 3, '', 4, 34),
	(22, '2026-01-06 12:36:13.272205', '48', 'test144', 3, '', 4, 34),
	(23, '2026-01-06 12:36:13.333207', '49', 'test145', 3, '', 4, 34),
	(24, '2026-01-06 12:36:13.355359', '50', 'test146', 3, '', 4, 34),
	(25, '2026-01-06 12:36:13.374451', '53', 'test152', 3, '', 4, 34),
	(26, '2026-01-06 12:36:13.396551', '36', 'test56', 3, '', 4, 34),
	(27, '2026-01-06 12:36:13.416553', '37', 'test57', 3, '', 4, 34),
	(28, '2026-01-06 12:36:13.437551', '38', 'test58', 3, '', 4, 34),
	(29, '2026-01-06 12:36:13.457202', '39', 'test59', 3, '', 4, 34),
	(30, '2026-01-06 12:36:13.479203', '40', 'test60', 3, '', 4, 34),
	(31, '2026-01-06 12:36:13.499416', '42', 'test62', 3, '', 4, 34),
	(32, '2026-01-06 12:36:13.520415', '44', 'test63', 3, '', 4, 34),
	(33, '2026-01-06 12:36:13.540415', '51', 'tt150', 3, '', 4, 34),
	(34, '2026-01-06 12:36:13.562513', '52', 'tt151', 3, '', 4, 34),
	(35, '2026-01-06 12:36:13.581515', '43', 'ttsdqsdqs', 3, '', 4, 34),
	(36, '2026-01-07 16:33:06.607437', '63', 'soldat3 - (user:test6, test6) : Soldier', 3, '', 16, 34),
	(37, '2026-01-07 16:43:13.867761', '64', 'soldat3 - (user:test6, test6) : Soldier', 3, '', 16, 34),
	(38, '2026-01-07 16:46:07.188269', '65', 'soldat3 - (user:test6, test6) : Soldier', 3, '', 16, 34),
	(39, '2026-01-07 16:46:47.628174', '66', 'soldat3 - (user:test6, test6) : Soldier', 3, '', 16, 34),
	(40, '2026-01-07 16:49:54.138888', '67', 'soldat3 - (user:test6, test6) : Soldier', 3, '', 16, 34),
	(41, '2026-01-07 16:51:09.297097', '68', 'soldat3 - (user:test6, test6) : Soldier', 2, '[{"changed": {"fields": ["Coordinates"]}}]', 16, 34),
	(42, '2026-01-08 14:14:23.404171', '1218', 'sector_1 - missile_10_medium_ship : {\'x\': \'11\', \'y\': \'33\'}', 3, '', 13, 34),
	(43, '2026-01-08 14:14:23.422689', '1217', 'sector_1 - missile_10_medium_ship : {\'x\': \'4\', \'y\': \'21\'}', 3, '', 13, 34),
	(44, '2026-01-08 14:14:23.439720', '1216', 'sector_1 - missile_10_medium_ship : {\'x\': \'17\', \'y\': \'4\'}', 3, '', 13, 34),
	(45, '2026-01-08 14:14:23.455866', '1215', 'sector_1 - laser_10_light_ship : {\'x\': \'27\', \'y\': \'31\'}', 3, '', 13, 34),
	(46, '2026-01-08 14:14:23.472845', '1214', 'sector_1 - laser_10_light_ship : {\'x\': \'18\', \'y\': \'19\'}', 3, '', 13, 34),
	(47, '2026-01-08 14:14:23.488075', '1213', 'sector_1 - laser_10_light_ship : {\'x\': \'13\', \'y\': \'7\'}', 3, '', 13, 34),
	(48, '2026-01-08 14:14:23.503977', '1152', 'tuto_sector - laser_10_light_ship : {\'x\': \'11\', \'y\': \'5\'}', 3, '', 13, 34),
	(49, '2026-01-08 14:14:23.563076', '1091', 'zone-transition - missile_10_medium_ship : {\'x\': \'8\', \'y\': \'26\'}', 3, '', 13, 34),
	(50, '2026-01-08 14:14:23.580075', '1090', 'zone-transition - missile_10_medium_ship : {\'x\': \'24\', \'y\': \'17\'}', 3, '', 13, 34),
	(51, '2026-01-08 14:14:23.594122', '1089', 'zone-transition - missile_10_medium_ship : {\'x\': \'31\', \'y\': \'4\'}', 3, '', 13, 34),
	(52, '2026-01-08 14:14:23.613456', '1088', 'zone-transition - laser_10_light_ship : {\'x\': \'30\', \'y\': \'31\'}', 3, '', 13, 34),
	(53, '2026-01-08 14:14:23.646486', '1087', 'zone-transition - laser_10_light_ship : {\'x\': \'32\', \'y\': \'25\'}', 3, '', 13, 34),
	(54, '2026-01-08 14:14:23.663400', '1086', 'zone-transition - laser_10_light_ship : {\'x\': \'24\', \'y\': \'28\'}', 3, '', 13, 34),
	(55, '2026-01-08 14:14:23.678476', '1085', 'zone-transition - laser_10_light_ship : {\'x\': \'6\', \'y\': \'12\'}', 3, '', 13, 34),
	(56, '2026-01-08 14:14:23.695865', '1084', 'zone-transition - laser_10_light_ship : {\'x\': \'3\', \'y\': \'13\'}', 3, '', 13, 34),
	(57, '2026-01-08 14:14:34.143537', '2', 'missile_10_medium_ship - diff : 10, behavior : close_range', 3, '', 14, 34),
	(58, '2026-01-08 14:14:34.161764', '1', 'laser_10_light_ship - diff : 10, behavior : long_range', 3, '', 14, 34);
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. django_content_type
CREATE TABLE IF NOT EXISTS `django_content_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.django_content_type : ~54 rows (environ)
DELETE FROM `django_content_type`;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
	(1, 'admin', 'logentry'),
	(3, 'auth', 'group'),
	(2, 'auth', 'permission'),
	(4, 'auth', 'user'),
	(5, 'contenttypes', 'contenttype'),
	(7, 'core', 'archetype'),
	(49, 'core', 'archetypemodule'),
	(8, 'core', 'asteroid'),
	(47, 'core', 'asteroidresource'),
	(9, 'core', 'cashshop'),
	(63, 'core', 'combateffect'),
	(10, 'core', 'faction'),
	(46, 'core', 'factionleader'),
	(60, 'core', 'factionmessage'),
	(45, 'core', 'factionrank'),
	(44, 'core', 'factionresource'),
	(56, 'core', 'group'),
	(57, 'core', 'groupmessage'),
	(11, 'core', 'log'),
	(48, 'core', 'loggedinuser'),
	(58, 'core', 'message'),
	(62, 'core', 'messagereadstatus'),
	(54, 'core', 'messagerecipient'),
	(12, 'core', 'module'),
	(13, 'core', 'npc'),
	(43, 'core', 'npcresource'),
	(14, 'core', 'npctemplate'),
	(42, 'core', 'npctemplateresource'),
	(41, 'core', 'npctemplateskill'),
	(15, 'core', 'planet'),
	(40, 'core', 'planetresource'),
	(16, 'core', 'player'),
	(61, 'core', 'playergroup'),
	(39, 'core', 'playerlog'),
	(38, 'core', 'playerprivatemessage'),
	(37, 'core', 'playerrecipe'),
	(36, 'core', 'playerresearch'),
	(35, 'core', 'playerresource'),
	(17, 'core', 'playership'),
	(50, 'core', 'playershipmodule'),
	(34, 'core', 'playershipresource'),
	(33, 'core', 'playerskill'),
	(53, 'core', 'privatemessage'),
	(55, 'core', 'privatemessagerecipients'),
	(32, 'core', 'recipe'),
	(31, 'core', 'research'),
	(18, 'core', 'resource'),
	(65, 'core', 'scaneffect'),
	(64, 'core', 'scanintel'),
	(66, 'core', 'scanintelgroup'),
	(19, 'core', 'sector'),
	(59, 'core', 'sectormessage'),
	(30, 'core', 'sectorwarpzone'),
	(20, 'core', 'security'),
	(29, 'core', 'ship'),
	(21, 'core', 'shipcategory'),
	(51, 'core', 'shipmodulelimitation'),
	(22, 'core', 'skill'),
	(28, 'core', 'skilleffect'),
	(52, 'core', 'skillexperience'),
	(23, 'core', 'station'),
	(27, 'core', 'stationresource'),
	(24, 'core', 'userpurchase'),
	(25, 'core', 'warp'),
	(26, 'core', 'warpzone'),
	(6, 'sessions', 'session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. django_migrations
CREATE TABLE IF NOT EXISTS `django_migrations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.django_migrations : ~44 rows (environ)
DELETE FROM `django_migrations`;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
	(1, 'contenttypes', '0001_initial', '2025-03-12 13:52:16.925380'),
	(2, 'auth', '0001_initial', '2025-03-12 13:52:21.806525'),
	(3, 'admin', '0001_initial', '2025-03-12 13:52:22.877256'),
	(4, 'admin', '0002_logentry_remove_auto_add', '2025-03-12 13:52:22.896916'),
	(5, 'admin', '0003_logentry_add_action_flag_choices', '2025-03-12 13:52:22.922837'),
	(6, 'admin', '0004_alter_logentry_id', '2025-03-12 13:52:23.374785'),
	(7, 'contenttypes', '0002_remove_content_type_name', '2025-03-12 13:52:24.044467'),
	(8, 'auth', '0002_alter_permission_name_max_length', '2025-03-12 13:52:24.103046'),
	(9, 'auth', '0003_alter_user_email_max_length', '2025-03-12 13:52:24.161225'),
	(10, 'auth', '0004_alter_user_username_opts', '2025-03-12 13:52:24.180809'),
	(11, 'auth', '0005_alter_user_last_login_null', '2025-03-12 13:52:24.500131'),
	(12, 'auth', '0006_require_contenttypes_0002', '2025-03-12 13:52:24.515241'),
	(13, 'auth', '0007_alter_validators_add_error_messages', '2025-03-12 13:52:24.536241'),
	(14, 'auth', '0008_alter_user_username_max_length', '2025-03-12 13:52:24.682345'),
	(15, 'auth', '0009_alter_user_last_name_max_length', '2025-03-12 13:52:24.740973'),
	(16, 'auth', '0010_alter_group_name_max_length', '2025-03-12 13:52:24.922016'),
	(17, 'auth', '0011_update_proxy_permissions', '2025-03-12 13:52:24.950016'),
	(18, 'auth', '0012_alter_user_first_name_max_length', '2025-03-12 13:52:25.038759'),
	(19, 'core', '0001_initial', '2025-03-12 13:52:59.039044'),
	(20, 'sessions', '0001_initial', '2025-03-12 13:52:59.519616'),
	(21, 'core', '0002_loggedinuser', '2025-04-14 12:28:33.256999'),
	(22, 'core', '0003_archetype_ship', '2025-05-19 13:23:54.043179'),
	(23, 'core', '0004_alter_playerskill_progress_archetypemodule', '2025-05-23 16:16:45.369460'),
	(24, 'core', '0005_playershipresource_created_at_and_more', '2025-05-23 16:39:35.255422'),
	(25, 'core', '0006_remove_playership_module_id_list', '2025-05-23 17:58:58.165294'),
	(26, 'core', '0007_shipcategory_ship_category_hp_and_more', '2025-05-26 07:08:45.824714'),
	(27, 'core', '0008_ship_default_ballistic_defense_and_more', '2025-05-26 08:01:17.084579'),
	(28, 'core', '0009_rename_colonization_warfare_module_limitation_shipmodulelimitation_colonization_module_limitation', '2025-05-26 08:38:56.418228'),
	(29, 'core', '0010_shipmodulelimitation_created_at_and_more', '2025-05-26 08:39:37.908098'),
	(30, 'core', '0011_skillexperience', '2025-05-26 13:21:39.181733'),
	(31, 'core', '0012_alter_playershipmodule_player_ship', '2025-05-27 10:13:13.405850'),
	(32, 'core', '0013_playership_max_ballistic_defense_and_more', '2025-06-03 13:41:51.774689'),
	(33, 'core', '0014_npctemplate_displayed_name', '2025-07-02 07:21:35.853184'),
	(34, 'core', '0015_remove_warpzone_name', '2025-07-08 09:00:23.003645'),
	(35, 'core', '0016_playership_view_range', '2025-07-16 08:26:20.880889'),
	(36, 'core', '0017_alter_sector_image_privatemessage', '2025-10-23 07:30:29.092282'),
	(37, 'core', '0018_alter_privatemessage_recipients_and_more', '2025-10-23 09:07:50.830336'),
	(38, 'core', '0019_delete_playerprivatemessage', '2025-10-23 11:10:13.997601'),
	(39, 'core', '0002_privatemessage_privatemessagerecipients', '2025-10-27 16:33:56.319865'),
	(40, 'core', '0003_rename_recipients_privatemessagerecipients_recipient', '2025-10-27 16:42:57.029929'),
	(41, 'core', '0004_privatemessagerecipients_is_author_and_more', '2025-10-28 13:33:28.768630'),
	(42, 'core', '0005_privatemessage_created_at_privatemessage_deleted_at_and_more', '2025-10-28 13:34:57.379896'),
	(43, 'core', '0006_alter_privatemessage_deleted_at_and_more', '2025-10-28 13:35:14.699104'),
	(44, 'core', '0007_alter_privatemessage_deleted_at_and_more', '2025-10-28 13:36:44.683520'),
	(45, 'core', '0008_alter_privatemessagerecipients_deleted_at', '2025-10-28 13:37:29.814943'),
	(46, 'core', '0009_alter_privatemessage_deleted_at_and_more', '2025-10-28 13:38:52.356962'),
	(47, 'core', '0010_alter_player_image', '2025-10-29 13:02:53.556806'),
	(48, 'core', '0011_alter_player_image', '2025-10-29 13:06:29.489573'),
	(49, 'core', '0012_group_message_sectormessage_playergroup_groupmessage_and_more', '2025-11-11 10:21:33.792378'),
	(50, 'core', '0013_player_last_time_warpzone', '2025-11-13 14:07:53.254737'),
	(51, 'core', '0014_alter_sectormessage_updated_at', '2025-11-17 07:49:18.513217'),
	(52, 'core', '0015_alter_factionmessage_created_at_and_more', '2025-11-17 08:14:33.235951'),
	(53, 'core', '0016_remove_factionmessage_updated_at_and_more', '2025-11-17 08:36:25.254158'),
	(54, 'core', '0017_alter_archetype_created_at_and_more', '2025-11-17 09:36:22.803131'),
	(55, 'core', '0018_alter_archetype_created_at_and_more', '2025-11-17 09:38:06.204514'),
	(56, 'core', '0019_messagereadstatus_remove_factionmessage_faction_and_more', '2025-11-17 14:15:18.120401'),
	(57, 'core', '0020_privatemessage_priority_and_more', '2025-11-18 13:25:18.555538'),
	(58, 'core', '0021_scanintel_combateffect', '2025-12-19 13:22:59.285113'),
	(59, 'core', '0022_remove_combateffect_target_player_and_more', '2025-12-19 13:40:14.634139'),
	(60, 'core', '0023_delete_scanintel', '2025-12-19 19:24:49.695332'),
	(61, 'core', '0024_scaneffect', '2025-12-19 19:56:31.347353'),
	(62, 'core', '0025_scanintel_scanintelgroup_and_more', '2025-12-19 21:45:06.575489'),
	(63, 'core', '0026_scanintel_invalidated_at_and_more', '2025-12-19 21:48:53.135429'),
	(64, 'core', '0027_alter_scanintelgroup_group', '2025-12-19 22:38:18.352535'),
	(65, 'core', '0028_npc_max_ballistic_defense_npc_max_hp_and_more', '2026-01-08 13:30:13.813232'),
	(66, 'core', '0029_remove_npc_max_ballistic_defense_and_more', '2026-01-08 13:45:11.191424'),
	(67, 'core', '0030_alter_log_content_alter_log_log_type_and_more', '2026-01-20 10:32:54.070539'),
	(68, 'core', '0030_playerlog_role_alter_log_content_alter_log_log_type_and_more', '2026-01-20 11:31:39.827533');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;

-- Export de la structure de la table recorp_db. django_session
CREATE TABLE IF NOT EXISTS `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Export de données de la table recorp_db.django_session : ~0 rows (environ)
DELETE FROM `django_session`;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
