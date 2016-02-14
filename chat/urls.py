import logging

from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.contrib import admin

from chat import settings
from chat.views import IssueView, RegisterView, ProfileView

logger = logging.getLogger(__name__)

admin.autodiscover()
urlpatterns = patterns(
	'',
	url(r'^admin/', include(admin.site.urls)),
	url(r'^$', 'chat.views.home'),  # url(r'^login$', 'story.views.login'),
	url(r'^logout$', 'chat.views.logout'),
	url(r'^auth$', 'chat.views.auth'),
	url(r'^register$', RegisterView.as_view(), name='register'),
	url(r'^confirm_email$', 'chat.views.confirm_email'),
	# story/register.js uses link below
	url(r'^validate_user$', 'chat.views.validate_user'),
	url(r'^update_session_key', 'chat.views.update_session_key'),
	url(r'^validate_email$', 'chat.views.validate_email'),
	url(r'^profile$', ProfileView.as_view(), name='profile'),
	url(r'^profile/(\d{1,5})$', 'chat.views.show_profile'),
	url(r'^report_issue$', IssueView.as_view(), name='issue'),
	url(r'^statistics$', 'chat.views.statistics'),
) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
