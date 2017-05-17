eval "$(ssh-agent -s)" #start the ssh agent
chmod 600 "$DEPLOYMENT_KEY" # this key should have push access
ssh-add "$DEPLOYMENT_KEY"
IP=45.56.70.141
if [ -z `ssh-keygen -F $IP` ]; then
  ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi
git remote add deploy ssh://jcai@$IP/cahbot/cahbot.git
git push deploy
