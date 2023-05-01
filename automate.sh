TIME=$(date +%s)
echo "$TIME"
echo "$TIME" >> keys.txt

KEY_0=$(0>/dev/null|shasum -a 256 | sed 's/-//g') && echo "$KEY_0" >> keys.txt && nostril --sec $KEY_0 -t nostr -t swarm --envelope --content "#nostr #swarm" | websocat ws://localhost:3000/nostr

#KEY=$(0>/dev/null|shasum -a 256 | sed 's/-//g') && echo "$KEY" >> keys.txt && nostril --sec $KEY -t nostr -t swarm --envelope --content "#nostr #swarm" | websocat wss://relay.damus.io

#nostril -t nostr -t swarm  --envelope  --content "#nostr #swarm" | websocat ws://localhost:3000/nostr
#nostril -t nostr -t swarm  --envelope  --content "#nostr #swarm" | websocat wss://relay.damus.io

KEY=$(echo "$TIME" | shasum -a 256 | sed 's/-//g')
echo "$KEY"
echo "$KEY" >> keys.txt
#nostril --sec $KEY -t nostr -t swarm --envelope --content "#nostr #swarm" | websocat wss://relay.damus.io
nostril --sec $KEY -t nostr -t swarm --envelope --content "$TIME: #nostr #swarm 🤙" | websocat wss://relay.damus.io
nostril --sec $KEY -t nostr -t swarm --envelope --content "$TIME: #nostr #swarm 🤙" | websocat ws://localhost:3000/nostr

echo $(( $KEY_0 ^ $KEY ))
