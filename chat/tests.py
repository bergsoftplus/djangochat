from random import randint
from random import random
from threading import Thread
from time import sleep

from django.conf import settings
from django.test import TestCase
from websocket import create_connection


#
# class ModelTest(TestCase):
#
# 	def test_gender(self):
# 		user = UserProfile(sex_str='Female')
# 		self.assertEqual(user.sex, 2)
# 		user.sex_str = 'Male'
# 		self.assertEqual(user.sex, 1)
# 		user.sex_str = 'WrongString'
# 		self.assertEqual(user.sex, 0)
#
#
# class RegisterUtilsTest(TestCase):
#
# 	def test_check_password(self):
# 		self.assertRaises(ValidationError, check_password, "ag")
# 		self.assertRaises(ValidationError, check_password, "")
# 		self.assertRaises(ValidationError, check_password, "  	")
# 		self.assertRaises(ValidationError, check_password, "  fs	")
# 		check_password("FineP@ssord")
#
# 	def test_send_email(self):
# 		up = UserProfile(username='Test', email='nightmare.quake@mail.ru', sex_str='Mail')
# 		send_email_verification(up, 'Any')
#
# 	def test_check_user(self):
# 		self.assertRaises(ValidationError, check_user, "d"*100)
# 		self.assertRaises(ValidationError, check_user, "asdfs,+")
# 		check_user("Fine")
#
#
# class SeleniumBrowserTest(TestCase):
#
# 	def test_check_main_page(self):
# 		driver = webdriver.Firefox()
# 		driver.get("localhost:8000")  # TODO inject url
# 		assert "chat" in driver.title
# 		elem = driver.find_element_by_id("userNameLabel")
# 		self.assertRegexpMatches(elem.text, "^[a-zA-Z-_0-9]{1,16}$")
# 		driver.close()


class WebSocketLoadTest(TestCase):

	SITE_TO_SPAM = "127.0.0.1:8888"

	def setUp(self):
		pass
		# Room.objects.create(name=ANONYMOUS_REDIS_ROOM)
		# subprocess.Popen("/usr/bin/redis-server")
		# thread = Thread(target=call_command, args=('start_tornado',))
		# thread.start()

	def threaded_function(self, session):
		cookies = '%s=%s;' % (settings.SESSION_COOKIE_NAME, session)
		ws = create_connection("ws://%s" % self.SITE_TO_SPAM, cookie=cookies)
		for i in range(randint(30, 50)):
			sleep(random())
			ws.send('{"content":"%d","action":"send"}' % i)

	def read_session(self):
		with open('sessionsids.txt') as f:
			lines =f.read().splitlines()
			return lines


	def test_simple(self):
		for session in self.read_session():
			for i in range(randint(10, 15)):
				thread = Thread(target=self.threaded_function, args=(session, ))
				thread.start()
