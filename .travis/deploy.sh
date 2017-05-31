eval "$(ssh-agent -s)" #start the ssh agent
chmod 600 .travis/id_rsa # this key should have push access
ssh-add .travis/id_rsa
IP=45.56.70.141
if [ -z `ssh-keygen -F $IP` ]; then
  ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi

DEPLOY_DIR=home/git/slack-cahbot/Slack-CahBot
git config --global push.default matching
git remote add deploy git@45.56.70.141:$DEPLOY_DIR
git push deploy master

ssh git@45.56.70.141:$DEPLOY_DIR "npm install"