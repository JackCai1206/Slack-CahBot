eval "$(ssh-agent -s)" #start the ssh agent
chmod 600 .travis/id_rsa # this key should have push access
ssh-add .travis/id_rsa
IP=45.56.70.141
if [ -z `ssh-keygen -F $IP` ]; then
  ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi

# git config --global push.default matching
# git remote add deploy git@45.56.70.141:/home/git/slack-cahbot/Slack-CahBot/
# git push deploy master

# git config user.email "ziyang_99@outlook.com"
# git config user.name "AsianPsychoBoy"

# git add .
# git commit -m "automated build"

# git status

scp -r build git@45.56.70.141:~/slack-cahbot/