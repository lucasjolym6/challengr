-- ============================================================================
-- LOVABLE CLOUD DATABASE EXPORT - PART 2: Transaction Data
-- Generated: 2025-10-02
-- This file contains large transactional tables (user_challenges, submissions, posts, etc.)
-- ============================================================================
-- IMPORTANT: Run 00_full_export.sql FIRST before running this file
-- ============================================================================

BEGIN;

SET search_path TO public;

-- ============================================================================
-- DATA: user_challenges (49 rows total) - First batch
-- ============================================================================

INSERT INTO public.user_challenges (id, user_id, challenge_id, status, started_at, completed_at, proof_text, proof_image_url, validation_status, validated_by, validated_at, validator_comment, rejection_reason, appeal_reason, appeal_requested_at, escalated_at, created_at) VALUES
('dc8d5dba-7314-43aa-b7da-c7957741070f', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '38155c87-67c0-472b-b800-63c0ed9d8b5b', 'completed', '2025-09-30 03:01:53.677+00', '2025-09-30 03:01:58.01+00', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 03:01:54.001994+00'),
('45b3d137-b960-4e5b-9a28-c7ec957c640c', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '244a8882-35d7-4b3a-9082-5047bbf0c7ce', 'completed', '2025-09-30 03:11:11.631+00', '2025-09-30 03:11:22.146+00', 'jzijd', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 03:11:11.752949+00'),
('b9131875-842c-462d-a4c6-e37fd4529a4b', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '156ae8f8-fcb7-4bad-80b3-65e5e38c7e07', 'completed', '2025-09-30 03:36:35.842+00', '2025-09-30 03:36:43.86+00', 'dde', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 03:36:35.98711+00'),
('0108fd06-4ff2-454b-85eb-1ae670551394', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '8f63b8ff-465c-4294-8af3-beb0a57dc2ea', 'completed', '2025-09-30 03:37:19.746+00', '2025-09-30 07:28:59.043+00', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 03:37:19.839985+00'),
('7dffce3c-b052-404b-8252-853611b3d5fb', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '931758d1-7436-429a-85de-999120ca01ee', 'completed', '2025-09-30 03:42:25.06+00', '2025-09-30 03:42:26.624+00', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 03:42:25.176503+00'),
('b609a07b-7372-44f5-b129-faf568a2cafb', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'd4d91d69-b7a0-4063-b441-684f1a1d7cac', 'completed', '2025-09-30 03:42:31.652+00', '2025-09-30 03:42:52.591+00', 'et voici', 'placeholder-url', 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 03:42:31.807095+00'),
('fe3d0a5c-ed9f-4a7a-8b51-a60e7c21ce83', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '573ac71a-512a-48c3-a1a0-f4a11ddd2e7f', 'to_do', NULL, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 03:56:23.226783+00'),
('0961e75f-ce28-42b5-90b8-ee7b39c2221d', '2f095188-bbae-4a26-9b91-20de5ba3ede1', '156ae8f8-fcb7-4bad-80b3-65e5e38c7e07', 'completed', '2025-09-30 07:21:15.645+00', '2025-09-30 07:21:35.233+00', ' dkz d', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 07:21:15.754082+00'),
('a7fb7ef6-0c2c-4b00-aded-fad2e4e5e65e', '2f095188-bbae-4a26-9b91-20de5ba3ede1', 'f0d97f82-1a55-40eb-a0ae-18a0b7226f53', 'to_do', NULL, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 07:23:08.028485+00'),
('c42d9ab6-3f6d-4840-935a-d8a6c2ef98b3', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '931758d1-7436-429a-85de-999120ca01ee', 'completed', '2025-09-30 07:28:14.804+00', '2025-09-30 07:28:39.104+00', ',kz,dk', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 07:28:14.899002+00');

INSERT INTO public.user_challenges (id, user_id, challenge_id, status, started_at, completed_at, proof_text, proof_image_url, validation_status, validated_by, validated_at, validator_comment, rejection_reason, appeal_reason, appeal_requested_at, escalated_at, created_at) VALUES
('8f2a6393-df9a-474a-b0cd-f38c4ac32ba3', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'ec4226bb-54dc-4ffc-8a3c-2449eef2e3e9', 'to_do', NULL, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 07:28:48.698956+00'),
('f0cc58e2-dadc-4a78-a77a-059ae8528be4', '34bba180-b67a-463e-8643-1178f3fb827a', '244a8882-35d7-4b3a-9082-5047bbf0c7ce', 'completed', '2025-09-30 20:26:30.859+00', '2025-09-30 20:26:38.541+00', 'nxkanon', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 20:26:30.942426+00'),
('ff84399c-2260-4153-98d1-f46357156397', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', '8f63b8ff-465c-4294-8af3-beb0a57dc2ea', 'completed', '2025-09-30 20:26:46.096+00', '2025-09-30 20:26:50.107+00', 'great job', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 20:26:46.172766+00'),
('9d5f4056-2ef3-4d0b-a382-85ba7e5ed9f3', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', '931758d1-7436-429a-85de-999120ca01ee', 'in_progress', '2025-09-30 20:27:00.831+00', NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 20:27:00.910486+00'),
('686581e0-cc4c-4192-951d-68a3d97edb2a', 'f376f55e-a416-4dc0-849b-c50168c85990', '4dd149c4-4823-43df-aa35-b0c08f82ba2a', 'completed', '2025-09-30 20:41:27.314+00', '2025-09-30 20:41:32.434+00', 'nimporte quoi', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 20:41:27.399186+00'),
('68343184-398a-422e-8bb7-d0dc70932aad', '34bba180-b67a-463e-8643-1178f3fb827a', '8b3dd58d-b80c-44c2-bbe3-dfa8efb86faa', 'completed', '2025-09-30 20:52:03.025+00', '2025-09-30 20:52:08.25+00', 'bjsbcqbscj', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 20:52:03.113813+00'),
('48f8b961-bc56-4644-8412-930b855ee735', '34bba180-b67a-463e-8643-1178f3fb827a', '9b362ef8-a105-4cff-81c8-4eeb1f5f9fac', 'completed', '2025-09-30 20:58:26.024+00', '2025-09-30 20:58:29.59+00', 'b jblbjbjb', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 20:58:26.114076+00'),
('2af4c53f-df9a-4ef8-88cd-b98789f5c4ce', '34bba180-b67a-463e-8643-1178f3fb827a', 'ecc8e6aa-729e-4366-aee2-458c02a8dffd', 'completed', '2025-09-30 21:05:40.983+00', '2025-09-30 21:05:47.496+00', 'jbsjb cjlsb cl', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 21:05:41.069892+00'),
('bc80becd-9d84-4e08-bd11-9ab238c27e59', 'f376f55e-a416-4dc0-849b-c50168c85990', '383404e5-05ef-44f5-9bf7-673349b298e8', 'completed', '2025-09-30 21:15:53.819+00', '2025-09-30 21:15:59.359+00', 'Raph review 1', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 21:15:53.896527+00'),
('e5605cbc-979e-457d-a550-9a8002c6d216', '34bba180-b67a-463e-8643-1178f3fb827a', '383404e5-05ef-44f5-9bf7-673349b298e8', 'completed', '2025-09-30 21:22:33.769+00', '2025-09-30 21:22:39.174+00', 'vivuivbi', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 21:22:33.85013+00');

INSERT INTO public.user_challenges (id, user_id, challenge_id, status, started_at, completed_at, proof_text, proof_image_url, validation_status, validated_by, validated_at, validator_comment, rejection_reason, appeal_reason, appeal_requested_at, escalated_at, created_at) VALUES
('c1f289cd-7d38-4fd4-a1d0-e2e291193fd3', 'f376f55e-a416-4dc0-849b-c50168c85990', 'ecc8e6aa-729e-4366-aee2-458c02a8dffd', 'completed', '2025-09-30 21:22:36.736+00', '2025-09-30 21:22:41.277+00', 'eeee', NULL, 'approved', 'f376f55e-a416-4dc0-849b-c50168c85990', '2025-09-30 21:23:19.197+00', '', NULL, NULL, NULL, NULL, '2025-09-30 21:22:36.822073+00'),
('d80df5b1-21e5-4ecc-8a37-0e65f4b4b3b9', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '38155c87-67c0-472b-b800-63c0ed9d8b5b', 'to_do', NULL, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-01 20:22:15.094887+00'),
('22ae6b73-d2e2-41bd-8ef8-7a309cbff0c7', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '93401854-6ddb-46b1-a62e-6f16e09b2a5e', 'to_do', NULL, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-01 20:25:44.039966+00'),
('a22ff6db-9b5e-44e7-ad88-49e5c9ad81b4', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'e11d7816-cc47-4f84-b7db-cf7b90f5b8cc', 'to_do', NULL, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-01 20:25:50.244656+00');

-- ============================================================================
-- DATA: submissions (10 rows)
-- ============================================================================

INSERT INTO public.submissions (id, user_id, challenge_id, proof_text, proof_image_url, proof_video_url, status, validator_id, validated_at, validator_comment, rejection_reason, created_at, updated_at) VALUES
('482a5e17-c671-4018-86e0-99b5850e74c1', '34bba180-b67a-463e-8643-1178f3fb827a', '244a8882-35d7-4b3a-9082-5047bbf0c7ce', 'nxkanon', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-09-30 20:26:38.557571+00', '2025-09-30 20:26:38.557571+00'),
('282db7dd-55a6-40fd-a626-abfcf9609346', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', '8f63b8ff-465c-4294-8af3-beb0a57dc2ea', 'great job', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-09-30 20:26:50.255397+00', '2025-09-30 20:26:50.255397+00'),
('f3987691-9ed5-40a6-a432-692610be88ca', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', '931758d1-7436-429a-85de-999120ca01ee', 'great job', 'https://detmqzxyxaybcfnxyceg.supabase.co/storage/v1/object/public/user-uploads/cb4880e2-75a7-4574-b1c3-65d40d3224e4/931758d1-7436-429a-85de-999120ca01ee/1759264055693-IMG_8092.PNG', NULL, 'pending', NULL, NULL, NULL, NULL, '2025-09-30 20:27:38.328397+00', '2025-09-30 20:27:38.328397+00'),
('9b70729c-8bd6-4c8b-9cac-7c3883eed801', 'f376f55e-a416-4dc0-849b-c50168c85990', '4dd149c4-4823-43df-aa35-b0c08f82ba2a', 'nimporte quoi', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-09-30 20:41:32.463449+00', '2025-09-30 20:41:32.463449+00'),
('32709e30-a003-44e7-8c6a-5d7f605ad816', '34bba180-b67a-463e-8643-1178f3fb827a', '8b3dd58d-b80c-44c2-bbe3-dfa8efb86faa', 'bjsbcqbscj', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-09-30 20:52:08.265449+00', '2025-09-30 20:52:08.265449+00'),
('9bc9bb42-1400-413d-9ee9-87efe9ed01de', '34bba180-b67a-463e-8643-1178f3fb827a', '9b362ef8-a105-4cff-81c8-4eeb1f5f9fac', 'b jblbjbjb', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-09-30 20:58:29.648793+00', '2025-09-30 20:58:29.648793+00'),
('a3888880-8c45-4e7d-8318-47cd70725d94', '34bba180-b67a-463e-8643-1178f3fb827a', 'ecc8e6aa-729e-4366-aee2-458c02a8dffd', 'jbsjb cjlsb cl', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-09-30 21:05:47.631645+00', '2025-09-30 21:05:47.631645+00'),
('9c75c397-b796-40ca-a721-aaae2398b199', 'f376f55e-a416-4dc0-849b-c50168c85990', '383404e5-05ef-44f5-9bf7-673349b298e8', 'Raph review 1', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-09-30 21:15:59.473745+00', '2025-09-30 21:15:59.473745+00'),
('b9f5601d-9c2f-45f2-9858-21280d38c34b', '34bba180-b67a-463e-8643-1178f3fb827a', '383404e5-05ef-44f5-9bf7-673349b298e8', 'vivuivbi', NULL, NULL, 'approved', '34bba180-b67a-463e-8643-1178f3fb827a', '2025-10-01 06:21:19.392+00', 'knkqn', NULL, '2025-09-30 21:22:39.195505+00', '2025-10-01 06:21:19.655422+00'),
('58c41268-b2b0-4ae2-96a3-d964ac32988a', 'f376f55e-a416-4dc0-849b-c50168c85990', 'ecc8e6aa-729e-4366-aee2-458c02a8dffd', 'eeee', NULL, NULL, 'approved', 'f376f55e-a416-4dc0-849b-c50168c85990', '2025-09-30 21:23:19.197+00', '', NULL, '2025-09-30 21:22:41.346691+00', '2025-09-30 21:23:19.428435+00');

-- ============================================================================
-- DATA: posts (14 rows)
-- ============================================================================

INSERT INTO public.posts (id, user_id, user_challenge_id, content, image_url, hashtags, likes_count, comments_count, verified, created_at) VALUES
('4a935596-372e-49ab-9f72-7027861e671e', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '45b3d137-b960-4e5b-9a28-c7ec957c640c', 'jzijd', NULL, '{#sports}', 1, 0, true, '2025-09-30 03:11:22.418078+00'),
('d4afc68f-1e6e-41e8-b63c-53cd3d372bcf', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'b9131875-842c-462d-a4c6-e37fd4529a4b', 'dde', NULL, '{#drawing}', 1, 1, true, '2025-09-30 03:36:44.080491+00'),
('271352e4-695a-4434-b554-3cb8f829fc46', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'b609a07b-7372-44f5-b129-faf568a2cafb', 'et voici', NULL, '{#writing}', 0, 0, true, '2025-09-30 03:42:52.921267+00'),
('2822298f-1cf9-49e4-9c13-7e92990609f2', '2f095188-bbae-4a26-9b91-20de5ba3ede1', '0961e75f-ce28-42b5-90b8-ee7b39c2221d', ' dkz d', NULL, '{#drawing}', 0, 0, true, '2025-09-30 07:21:35.360939+00'),
('1d6dfe55-5fd4-4f29-984b-e867a0972152', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'c42d9ab6-3f6d-4840-935a-d8a6c2ef98b3', ',kz,dk', NULL, '{#cooking}', 2, 1, true, '2025-09-30 07:28:39.248774+00'),
('c4569625-8f55-4414-842a-e0407f51e71c', '34bba180-b67a-463e-8643-1178f3fb827a', 'f0cc58e2-dadc-4a78-a77a-059ae8528be4', 'nxkanon', NULL, '{#sports}', 0, 0, true, '2025-09-30 20:26:38.671601+00'),
('4bfe100c-6f75-4373-ba46-105d8b4ff344', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', 'ff84399c-2260-4153-98d1-f46357156397', 'great job', NULL, '{#music}', 0, 0, true, '2025-09-30 20:26:50.371061+00'),
('bda52343-fd03-427e-b8ef-8be57f4f10c2', 'f376f55e-a416-4dc0-849b-c50168c85990', '686581e0-cc4c-4192-951d-68a3d97edb2a', 'nimporte quoi', NULL, '{#music}', 1, 0, true, '2025-09-30 20:41:32.54314+00'),
('0647d621-5721-4153-8253-d9ef567a75df', '34bba180-b67a-463e-8643-1178f3fb827a', '68343184-398a-422e-8bb7-d0dc70932aad', 'bjsbcqbscj', NULL, '{#drawing}', 1, 8, true, '2025-09-30 20:52:08.39245+00'),
('bd1f42b0-2def-4888-8ac3-032c6c305965', '34bba180-b67a-463e-8643-1178f3fb827a', '48f8b961-bc56-4644-8412-930b855ee735', 'b jblbjbjb', NULL, '{#music}', 1, 2, true, '2025-09-30 20:58:29.731788+00');

INSERT INTO public.posts (id, user_id, user_challenge_id, content, image_url, hashtags, likes_count, comments_count, verified, created_at) VALUES
('2a92098d-7858-4c38-9ceb-6078452fc339', '34bba180-b67a-463e-8643-1178f3fb827a', '2af4c53f-df9a-4ef8-88cd-b98789f5c4ce', 'jbsjb cjlsb cl', NULL, '{#drawing}', 0, 0, false, '2025-09-30 21:05:47.957779+00'),
('1c0c7402-ebe8-41c7-ae58-47fb5a6db3e2', 'f376f55e-a416-4dc0-849b-c50168c85990', 'bc80becd-9d84-4e08-bd11-9ab238c27e59', 'Raph review 1', NULL, '{#music}', 1, 6, true, '2025-09-30 21:15:59.527422+00'),
('97548a4a-26ae-4924-bd17-f7f6f60d359f', '34bba180-b67a-463e-8643-1178f3fb827a', 'e5605cbc-979e-457d-a550-9a8002c6d216', 'vivuivbi', NULL, '{#music}', 0, 0, false, '2025-09-30 21:22:39.302614+00'),
('14ce9715-60a5-42a0-a55f-e63a84c203af', 'f376f55e-a416-4dc0-849b-c50168c85990', 'c1f289cd-7d38-4fd4-a1d0-e2e291193fd3', 'eeee', NULL, '{#drawing}', 0, 0, false, '2025-09-30 21:22:41.402436+00');

-- ============================================================================
-- DATA: comments (18 rows)
-- ============================================================================

INSERT INTO public.comments (id, post_id, user_id, content, created_at) VALUES
('6f72d9f9-b48a-45f4-a1c6-5f30b7001fcc', 'd4afc68f-1e6e-41e8-b63c-53cd3d372bcf', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'nkcdnc', '2025-09-30 03:37:38.109358+00'),
('dde072c0-2416-483d-b719-934b721d0975', '1d6dfe55-5fd4-4f29-984b-e867a0972152', '34bba180-b67a-463e-8643-1178f3fb827a', 'nulll', '2025-09-30 13:26:32.461262+00'),
('0e0ba5c4-a4f0-4fab-ae43-9dabaf94102f', '1c0c7402-ebe8-41c7-ae58-47fb5a6db3e2', '34bba180-b67a-463e-8643-1178f3fb827a', 'superrr', '2025-09-30 21:18:42.87976+00'),
('ced4a6f5-3adb-434a-80ec-542ac69e8377', 'bd1f42b0-2def-4888-8ac3-032c6c305965', 'f376f55e-a416-4dc0-849b-c50168c85990', 'yeahh', '2025-10-01 17:18:29.71909+00'),
('74860509-edcd-4552-91c9-f8a74ea8c205', 'bd1f42b0-2def-4888-8ac3-032c6c305965', 'f376f55e-a416-4dc0-849b-c50168c85990', 'a ouais ?', '2025-10-01 17:18:38.579302+00'),
('b6edddcd-39ca-4f21-9a15-25e728ecb22b', '1c0c7402-ebe8-41c7-ae58-47fb5a6db3e2', 'f376f55e-a416-4dc0-849b-c50168c85990', 'top', '2025-10-01 17:30:08.368311+00'),
('a988d5e6-0889-4f94-966b-5e8e6b70d865', '1c0c7402-ebe8-41c7-ae58-47fb5a6db3e2', 'f376f55e-a416-4dc0-849b-c50168c85990', 'eee', '2025-10-01 17:30:14.334913+00'),
('d47cd792-70a8-45a4-acbe-3e3502c985d1', '1c0c7402-ebe8-41c7-ae58-47fb5a6db3e2', 'f376f55e-a416-4dc0-849b-c50168c85990', 'e', '2025-10-01 17:30:15.250514+00'),
('099f2954-6159-45e2-ba6e-52ed87a4e23e', '1c0c7402-ebe8-41c7-ae58-47fb5a6db3e2', 'f376f55e-a416-4dc0-849b-c50168c85990', 'e', '2025-10-01 17:30:16.008663+00'),
('ff49392e-d645-46ca-a249-b204ad45fccf', '1c0c7402-ebe8-41c7-ae58-47fb5a6db3e2', 'f376f55e-a416-4dc0-849b-c50168c85990', 'waww les gas engageons sur ce post !', '2025-10-01 17:30:28.499582+00');

INSERT INTO public.comments (id, post_id, user_id, content, created_at) VALUES
('2ea72275-dbbb-47e6-ae64-f72bb468a775', '0647d621-5721-4153-8253-d9ef567a75df', 'f376f55e-a416-4dc0-849b-c50168c85990', 'eengaageons', '2025-10-01 17:30:47.786389+00'),
('c47e8e36-a065-480b-bd0d-cf92baee967a', '0647d621-5721-4153-8253-d9ef567a75df', 'f376f55e-a416-4dc0-849b-c50168c85990', 's', '2025-10-01 17:30:48.705372+00'),
('843dc42b-f11b-471d-a16c-897c1bc2250a', '0647d621-5721-4153-8253-d9ef567a75df', 'f376f55e-a416-4dc0-849b-c50168c85990', 's', '2025-10-01 17:30:49.658958+00'),
('21283db8-82cc-40e8-9744-cb003c833d7e', '0647d621-5721-4153-8253-d9ef567a75df', 'f376f55e-a416-4dc0-849b-c50168c85990', 's', '2025-10-01 17:30:50.462224+00'),
('83e581d1-7b82-430a-829b-f8d2071aae25', '0647d621-5721-4153-8253-d9ef567a75df', 'f376f55e-a416-4dc0-849b-c50168c85990', 'c', '2025-10-01 17:30:51.650166+00'),
('9058f219-ebcf-4400-93bc-d0c09b436069', '0647d621-5721-4153-8253-d9ef567a75df', 'f376f55e-a416-4dc0-849b-c50168c85990', 'ssdfq', '2025-10-01 17:31:11.040695+00'),
('818cfd72-8dd1-4421-9feb-a9c1135cc6a9', '0647d621-5721-4153-8253-d9ef567a75df', 'f376f55e-a416-4dc0-849b-c50168c85990', 'd<sf', '2025-10-01 17:31:12.508898+00'),
('62439cbb-b5c2-4b86-bac6-5c777809b1e3', '0647d621-5721-4153-8253-d9ef567a75df', 'f376f55e-a416-4dc0-849b-c50168c85990', 'df<sd', '2025-10-01 17:31:14.03956+00');

-- ============================================================================
-- DATA: likes (8 rows)
-- ============================================================================

INSERT INTO public.likes (id, post_id, user_id, created_at) VALUES
('a6f12e0e-f318-4eac-9ac3-51cfa655e802', '4a935596-372e-49ab-9f72-7027861e671e', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '2025-09-30 03:11:29.846506+00'),
('d1c0a1a9-9dcb-469b-8848-da95b1b4a1d1', 'd4afc68f-1e6e-41e8-b63c-53cd3d372bcf', '0d1e4bbb-323e-467d-8bc9-79da2edec281', '2025-09-30 03:37:46.152199+00'),
('afb16373-c3e5-4256-b6ed-6bdc7da5eda3', '1d6dfe55-5fd4-4f29-984b-e867a0972152', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', '2025-09-30 07:47:46.09129+00'),
('62948b86-4a41-4023-b8c2-02864aac9ff5', '1d6dfe55-5fd4-4f29-984b-e867a0972152', '34bba180-b67a-463e-8643-1178f3fb827a', '2025-09-30 14:01:05.370882+00'),
('1041cd2e-8fe4-4357-a91e-088722101262', 'bda52343-fd03-427e-b8ef-8be57f4f10c2', '34bba180-b67a-463e-8643-1178f3fb827a', '2025-09-30 20:46:04.768483+00'),
('e10bd6ed-c239-459a-a4cd-3022f2f0fbbc', '1c0c7402-ebe8-41c7-ae58-47fb5a6db3e2', '34bba180-b67a-463e-8643-1178f3fb827a', '2025-10-01 06:47:01.556991+00'),
('a3a72e59-0e0a-43bb-8938-f317baf286c2', 'bd1f42b0-2def-4888-8ac3-032c6c305965', '34bba180-b67a-463e-8643-1178f3fb827a', '2025-10-01 06:47:07.459598+00'),
('ee56d553-60ec-4c83-aee2-7ffd5d4e8e2d', '0647d621-5721-4153-8253-d9ef567a75df', 'f376f55e-a416-4dc0-849b-c50168c85990', '2025-10-01 17:32:55.956906+00');

-- ============================================================================
-- DATA: messages (10 rows)
-- ============================================================================

INSERT INTO public.messages (id, sender_id, receiver_id, content, challenge_id, read_at, created_at) VALUES
('0f7e8997-c52a-4514-94de-b8a612532dad', '34bba180-b67a-463e-8643-1178f3fb827a', '3062f7a8-6ccb-4902-84bf-8654ab948bca', NULL, '931758d1-7436-429a-85de-999120ca01ee', NULL, '2025-09-30 12:58:23.814262+00'),
('07b0e8f4-e033-447e-a933-57ad792d22df', '34bba180-b67a-463e-8643-1178f3fb827a', '3062f7a8-6ccb-4902-84bf-8654ab948bca', 'HI !', NULL, NULL, '2025-09-30 13:06:21.332554+00'),
('0ad8c4a9-9141-4e1f-b24e-2b59c257f45c', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', '34bba180-b67a-463e-8643-1178f3fb827a', 'yo', NULL, '2025-09-30 20:24:13.678+00', '2025-09-30 20:24:09.060153+00'),
('be59d3df-354e-4b44-8550-8072195b9ade', '34bba180-b67a-463e-8643-1178f3fb827a', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', 'salut mec', NULL, '2025-09-30 20:24:18.584+00', '2025-09-30 20:24:18.460643+00'),
('e17e624e-1320-407e-a6df-82a4072c8dc5', '34bba180-b67a-463e-8643-1178f3fb827a', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', NULL, '156ae8f8-fcb7-4bad-80b3-65e5e38c7e07', '2025-09-30 20:24:21.835+00', '2025-09-30 20:24:21.780217+00'),
('229b2e1c-929e-4e15-abd4-38b4610a495c', '34bba180-b67a-463e-8643-1178f3fb827a', 'cb4880e2-75a7-4574-b1c3-65d40d3224e4', NULL, '01b28b31-6a8e-4a3e-a438-b36fafe82e2a', '2025-09-30 20:24:42.21+00', '2025-09-30 20:24:37.52027+00'),
('8c92bc2b-3d2d-4722-8f05-6e7ba7e10a1c', 'f376f55e-a416-4dc0-849b-c50168c85990', '34bba180-b67a-463e-8643-1178f3fb827a', 'Ça va mec', NULL, NULL, '2025-10-01 17:52:33.296655+00'),
('426456a6-fd6e-42de-968c-e2627450e39e', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'e429e526-281d-41a1-b3e4-e8e03066b954', NULL, '38155c87-67c0-472b-b800-63c0ed9d8b5b', NULL, '2025-10-01 20:25:54.146688+00'),
('cdd25723-5ca7-4088-a302-e12748b28f4f', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'e429e526-281d-41a1-b3e4-e8e03066b954', NULL, '931758d1-7436-429a-85de-999120ca01ee', NULL, '2025-10-01 20:25:54.651318+00'),
('fa373c70-d102-4607-a821-b0a3359d7841', '0d1e4bbb-323e-467d-8bc9-79da2edec281', 'e429e526-281d-41a1-b3e4-e8e03066b954', NULL, '931758d1-7436-429a-85de-999120ca01ee', NULL, '2025-10-01 20:25:55.649038+00');

-- ============================================================================
-- DATA: validation_audit (2 rows)
-- ============================================================================

INSERT INTO public.validation_audit (id, user_challenge_id, submission_id, validator_id, action, reason, comment, metadata, created_at) VALUES
('9547a76d-c013-44c7-876f-d0cabdbf0c1a', 'c1f289cd-7d38-4fd4-a1d0-e2e291193fd3', '58c41268-b2b0-4ae2-96a3-d964ac32988a', 'f376f55e-a416-4dc0-849b-c50168c85990', 'approved', NULL, '', NULL, '2025-09-30 21:23:20.393752+00'),
('ca3f3b99-c08d-4c7c-9274-11a10cb1ece6', 'e5605cbc-979e-457d-a550-9a8002c6d216', 'b9f5601d-9c2f-45f2-9858-21280d38c34b', '34bba180-b67a-463e-8643-1178f3fb827a', 'approved', NULL, 'knkqn', NULL, '2025-10-01 06:21:21.341709+00');

-- ============================================================================
-- DATA: validator_notifications (7 rows)
-- ============================================================================

INSERT INTO public.validator_notifications (id, validator_id, user_challenge_id, submission_id, type, read_at, created_at) VALUES
('bbe71c1b-3952-4be4-94a9-c010ba5c7bc5', '34bba180-b67a-463e-8643-1178f3fb827a', '686581e0-cc4c-4192-951d-68a3d97edb2a', '9b70729c-8bd6-4c8b-9cac-7c3883eed801', 'new_submission', NULL, '2025-09-30 20:41:32.625725+00'),
('e69beb88-6bb8-4432-9454-bd754e67d662', 'f376f55e-a416-4dc0-849b-c50168c85990', '68343184-398a-422e-8bb7-d0dc70932aad', '32709e30-a003-44e7-8c6a-5d7f605ad816', 'new_submission', NULL, '2025-09-30 20:52:08.507938+00'),
('8ef5b3f6-f689-45ea-9518-9128e55a7ee8', 'f376f55e-a416-4dc0-849b-c50168c85990', '48f8b961-bc56-4644-8412-930b855ee735', '9bc9bb42-1400-413d-9ee9-87efe9ed01de', 'new_submission', NULL, '2025-09-30 20:58:29.805537+00'),
('6bcf3bcb-c489-46bb-948f-874bd6198f93', 'f376f55e-a416-4dc0-849b-c50168c85990', '2af4c53f-df9a-4ef8-88cd-b98789f5c4ce', 'a3888880-8c45-4e7d-8318-47cd70725d94', 'new_submission', NULL, '2025-09-30 21:05:48.31301+00'),
('20e1c5e8-ce79-4d3c-a115-ca2468be040e', '34bba180-b67a-463e-8643-1178f3fb827a', 'bc80becd-9d84-4e08-bd11-9ab238c27e59', '9c75c397-b796-40ca-a721-aaae2398b199', 'new_submission', NULL, '2025-09-30 21:15:59.582955+00'),
('768a792f-7dca-443a-ba1e-b58ad442041b', '34bba180-b67a-463e-8643-1178f3fb827a', 'e5605cbc-979e-457d-a550-9a8002c6d216', 'b9f5601d-9c2f-45f2-9858-21280d38c34b', 'new_submission', NULL, '2025-09-30 21:22:39.433007+00'),
('8b432b89-9437-4558-bf89-e214ede70a01', 'f376f55e-a416-4dc0-849b-c50168c85990', 'c1f289cd-7d38-4fd4-a1d0-e2e291193fd3', '58c41268-b2b0-4ae2-96a3-d964ac32988a', 'new_submission', NULL, '2025-09-30 21:22:41.449071+00');

COMMIT;

-- ============================================================================
-- INTEGRITY CHECKS (Optional - uncomment to run after import)
-- ============================================================================
/*
SELECT 'admin_config' as table_name, COUNT(*) as row_count FROM public.admin_config
UNION ALL
SELECT 'badges', COUNT(*) FROM public.badges
UNION ALL
SELECT 'challenge_categories', COUNT(*) FROM public.challenge_categories
UNION ALL
SELECT 'challenges', COUNT(*) FROM public.challenges
UNION ALL
SELECT 'coaching_content', COUNT(*) FROM public.coaching_content
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles
UNION ALL
SELECT 'user_friends', COUNT(*) FROM public.user_friends
UNION ALL
SELECT 'user_challenges', COUNT(*) FROM public.user_challenges
UNION ALL
SELECT 'submissions', COUNT(*) FROM public.submissions
UNION ALL
SELECT 'posts', COUNT(*) FROM public.posts
UNION ALL
SELECT 'comments', COUNT(*) FROM public.comments
UNION ALL
SELECT 'likes', COUNT(*) FROM public.likes
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages
UNION ALL
SELECT 'user_badges', COUNT(*) FROM public.user_badges
UNION ALL
SELECT 'user_challenge_defeats', COUNT(*) FROM public.user_challenge_defeats
UNION ALL
SELECT 'submission_reports', COUNT(*) FROM public.submission_reports
UNION ALL
SELECT 'validation_audit', COUNT(*) FROM public.validation_audit
UNION ALL
SELECT 'validator_notifications', COUNT(*) FROM public.validator_notifications
ORDER BY table_name;
*/

-- ============================================================================
-- END OF EXPORT - Part 2
-- ============================================================================
