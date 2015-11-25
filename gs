#!/bin/bash

GS=$0

git_last_commit_msg() {
	echo `git log -1 --pretty=%B`
}

git_changes_present() {
	echo `[[ -z $(git status -s) ]]`
}

git_current_branch() {
	echo `git rev-parse --abbrev-ref HEAD`
}

say() {
	echo "******** $*"
}

begin_git_block() {
	echo "********"
}

end_git_block() {
	echo "********"
}

absname() {
  # $1 : relative filename
  if [ -d "$(dirname "$1")" ]; then
    echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
  fi
}

case $1 in

	install)
		if [ "$2" == "" ]
		then
			say "No symbolic name provided: aborting installation"
		else
			say "Linking $GS to /usr/local/bin/$2"
			[ -L /usr/local/bin/$2 ] && rm /usr/local/bin/$2
			ln -s `absname $GS` /usr/local/bin/$2
		fi
		;;

	sync)
		CURRENT_BRANCH=`git_current_branch`
		LOCAL_CHANGES=`git_changes_present`

		if $LOCAL_CHANGES
		then
			say "Local changes detected: WIPping them"
			$GS wip
		fi

		say "Pulling origin/master to local master branch"
		begin_git_block
		git co master
		git pull --rebase origin master
		git co $CURRENT_BRANCH
		end_git_block

		if $LOCAL_CHANGES
		then
			say "UnWIPping local changes again to leave everything as it was before"
			$GS unwip
		fi
		;;

	unwip)
		if [ "`git_last_commit_msg`" == "WIP" ]
		then
			say "Previous WIP commit found: resetting it to WC"

			begin_git_block
			git reset HEAD~1
			end_git_block
		else
			say "No previous WIP commit found: cannot unwip"
		fi
		;;

	wip)
		if [ "`git_last_commit_msg`" == "WIP" ]
		then
			say "Previous WIP commit found: amending it"

			begin_git_block
			git add .
			git commit -m "WIP" --amend
			end_git_block
		else
			say "No previous WIP commit found: creating it"

			begin_git_block
			git add .
			git commit -m "WIP"
			end_git_block
		fi
		;;

	*)
		echo "Usage: `basename $GS` <command>"
		echo ""
		echo "    Available commands:"
		echo ""
		echo "        sync     Pull upstream changes to local master branch"
		echo "        unwip    Uncommit WIP changes to working copy"
		echo "        wip      Commit working copy changes as WIP"
		echo ""
		echo "    Advanced commands:"
		echo ""
		echo "        install  Install $GS script to /usr/local/bin/<name>"
		echo "                 (arguments: <name>)"
		echo ""
		;;
esac
