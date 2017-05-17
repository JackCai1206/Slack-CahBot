eval "$(ssh-agent -s)" #start the ssh agent
echo $DEPLOYMENT_KEY > deployment_key
install -vm700 <(echo "echo $PASSPHRASE") "ps.sh"
chmod 600 deployment_key # this key should have push access
[[ -z "$DISPLAY" ]] && export DISPLAY=:0
< id_rsa SSH_ASKPASS="ps.sh" ssh-add deployment_key - && shred -n3 -uz  $PWD/ps.sh
rm deployment_key
IP=45.56.70.141
if [ -z `ssh-keygen -F $IP` ]; then
  ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi
git remote add deploy ssh://jcai@$IP/~/Slack-CahBot
git push deploy
