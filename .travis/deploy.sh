eval "$(ssh-agent -s)" #start the ssh agent
chmod 600 .travis/id_rsa # this key should have push access
ssh-add .travis/id_rsa
IP=45.56.70.141
if [ -z `ssh-keygen -F $IP` ]; then
  ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi
# echo "exec cat" > ap-cat.sh
# chmod a+x ap-cat.sh
# export DISPLAY=1
# echo $PASSPHRASE | SSH_ASKPASS=./ap-cat.sh ssh-add deployment_key
# rm ap-cat.sh
git remote add deploy git@45.56.70.141:/~/Slack-CahBot/
git push deploy
