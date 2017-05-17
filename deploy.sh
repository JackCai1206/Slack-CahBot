eval "$(ssh-agent -s)" #start the ssh agent
echo $DEPLOYMENT_KEY > deployment_key
chmod 600 deployment_key # this key should have push access
ssh-add deployment_key
rm deployment_key
IP=45.56.70.141
if [ -z `ssh-keygen -F $IP` ]; then
  ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi
git remote add deploy ssh://jcai@$IP/~/Slack-CahBot
git push deploy
