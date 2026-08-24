# Website to APK Template

आपको सामान्यतः सिर्फ 3 चीजें बदलनी हैं:

1. APP_NAME = APK का नाम
2. WEBSITE_URL = आपकी website का URL
3. ICON_FILE = आपके logo का नाम

मुख्य config file: `app-config.properties`

Example:
APP_NAME=Hostel Booker
WEBSITE_URL=https://example.com
ICON_FILE=app_icon

Logo को `app/src/main/res/drawable/` में PNG के रूप में रखें।

APK बनाने के लिए GitHub में files upload करें, main branch पर push करें,
फिर Actions → Build Website APK → Artifacts → Website-APK से APK लें।

यह WebView template JavaScript, local storage, back button और website file-upload chooser को support करता है।
