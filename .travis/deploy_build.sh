git config user.email "ziyang_99@outlook.com"
git config user.name "AsianPsychoBoy"

git add .
git commit -m "automated build"

scp -r build git@45.56.70.141:~/slack-cahbot/