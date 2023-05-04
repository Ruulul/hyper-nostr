$(which python3) ./hypernostr.py > WEEBLE:WOBBLE

TIME=$(date +%s)
export TIME
echo "$TIME"
echo "$TIME" >> keys.txt

KEY_0=$(0>/dev/null|shasum -a 256 | sed 's/-//g') && echo "$KEY_0" >> keys.txt && nostril --sec $KEY_0 -t hyper-swarm -t "$TIME" -t nostr -t swarm --envelope --content "#nostr #swarm" | websocat ws://localhost:3000/nostr

#KEY=$(0>/dev/null|shasum -a 256 | sed 's/-//g') && echo "$KEY" >> keys.txt && nostril --sec $KEY -t nostr -t swarm --envelope --content "#nostr #swarm" | websocat wss://relay.damus.io

#nostril -t nostr -t swarm  --envelope  --content "#nostr #swarm" | websocat ws://localhost:3000/nostr
#nostril -t nostr -t swarm  --envelope  --content "#nostr #swarm" | websocat wss://relay.damus.io

KEY=$(echo "$TIME" | shasum -a 256 | sed 's/-//g')
echo "$KEY"
echo "$KEY" >> keys.txt
#nostril --sec $KEY -t nostr -t swarm --envelope --content "#nostr #swarm" | websocat wss://relay.damus.io
#nostril --sec $KEY -t "$TIME" -t hyper-swarm -t nostr -t swarm --envelope --content "$TIME: #nostr #swarm 🤙" | websocat wss://relay.damus.io
nostril --sec $KEY -t "$TIME" -t hyper-swarm -t nostr -t swarm --envelope --content "$TIME: #nostr #swarm 🤙" | websocat ws://localhost:3000/nostr

#nostril --sec $KEY -t "$TIME" -t hyper-swarm -t nostr -t swarm --envelope --content "$TIME: $(git diff -- DIFFICULTY)" | websocat ws://localhost:3000/nostr
#nostril --sec $KEY -t "$TIME" -t hyper-swarm -t nostr -t swarm --envelope --content "$TIME: #gitstr #test $(git diff)" | websocat ws://localhost:3000/nostr
nostril --sec $KEY -t "$TIME" -t "$(echo "$(echo uname -srm)")" -t gitstr -t nostr -t swarm --envelope --content "$TIME: #gitstr #test $(git diff)" | websocat wss://relay.damus.io
#cat ./topics/nostr.json
#echo $(( $KEY_0 ^ $KEY ))
