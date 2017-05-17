eval "$(ssh-agent -s)" #start the ssh agent
DEPLOYMENT_KEY_PATH="~/deployment_key.pub"
echo $DEPLOYMENT_KEY > $DEPLOYMENT_KEY_PATH
echo $PASSPHRASE > ~/passphrase
chmod 600 DEPLOYMENT_KEY_PATH # this key should have push access
<~/passphrase ssh-add -p $DEPLOYMENT_KEY_PATH
rm $DEPLOYMENT_KEY_PATH
IP=45.56.70.141
if [ -z `ssh-keygen -F $IP` ]; then
  ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi
git remote add deploy ssh://jcai@$IP/~/Slack-CahBot
git push deploy
