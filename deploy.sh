eval "$(ssh-agent -s)" #start the ssh agent
echo $DEPLOYMENT_KEY >> .travis/deployment_key.pub
chmod 600 .travis/deployment_key.pub # this key should have push access
ssh-add .travis/deployment_key.pub
IP=45.56.70.141
if [ -z `ssh-keygen -F $IP` ]; then
  ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi
git remote add deploy ssh://jcai@$IP/cahbot/cahbot.git
git push deploy
