import contractABI from "./abi.json";

const contractAddress = "0xD46306258f861F8648aa29f78e3A81C609DdeCdE";

let web3 = new Web3(window.ethereum);
let contract = new web3.eth.Contract(contractABI, contractAddress);

async function connectWallet() {
  const connect = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        // Request account access if needed
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts", // This method prompts the user to connect their wallet
        });

        // If the user connected their wallet, accounts will be an array of addresses
        if (accounts.length > 0) {
          setConnected(accounts[0]);
        } else {
          console.log("No accounts found.");
        }
      } catch (err) {
        console.error(err.message);
      }
    } else {
      console.log("MetaMask is not installed.");
    }
  };

  await connect();
}

async function createTweet(content) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods.createTweet(content).send({ from: accounts[0] });
    displayTweets(accounts[0]);
  } catch (error) {
    console.error("User rejected request:", error);
  }
}

async function displayTweets(userAddress) {
  const tweetsContainer = document.getElementById("tweetsContainer");
  tweetsContainer.innerHTML = "";
  const tempTweets = await contract.methods.getAllTweets(userAddress).call();
  // we do this so we can sort the tweets  by timestamp
  const tweets = [...tempTweets];
  tweets.sort((a, b) => b.timestamp - a.timestamp);
  for (let i = 0; i < tweets.length; i++) {
    const tweetElement = document.createElement("div");
    tweetElement.className = "tweet";

    const userIcon = document.createElement("img");
    userIcon.className = "user-icon";
    userIcon.src = `https://avatars.dicebear.com/api/human/${tweets[i].author}.svg`;
    userIcon.alt = "User Icon";

    tweetElement.appendChild(userIcon);

    const tweetInner = document.createElement("div");
    tweetInner.className = "tweet-inner";

    tweetInner.innerHTML += `
        <div class="author">${shortAddress(tweets[i].author)}</div>
        <div class="content">${tweets[i].content}</div>
    `;

    const likeButton = document.createElement("button");
    likeButton.className = "like-button";
    likeButton.innerHTML = `
        <i class="far fa-heart"></i>
        <span class="likes-count">${tweets[i].likes}</span>
    `;
    likeButton.setAttribute("data-id", tweets[i].id);
    likeButton.setAttribute("data-author", tweets[i].author);

    addLikeButtonListener(
      likeButton,
      userAddress,
      tweets[i].id,
      tweets[i].author
    );
    tweetInner.appendChild(likeButton);
    tweetElement.appendChild(tweetInner);

    tweetsContainer.appendChild(tweetElement);
  }
}

function addLikeButtonListener(likeButton, address, id, author) {
  likeButton.addEventListener("click", async (e) => {
    e.preventDefault();

    e.currentTarget.innerHTML = '<div class="spinner"></div>';
    e.currentTarget.disabled = true;
    try {
      await likeTweet(author, id);
      displayTweets(address);
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  });
}

function shortAddress(address, startLength = 6, endLength = 4) {
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

async function likeTweet(author, id) {
  try {
    const accounts = await web3.eth.getAccounts();
    await contract.methods.likeTweet(author, id).send({ from: accounts[0] });
  } catch (error) {
    console.error("User rejected request:", error);
  }
}

function setConnected(address) {
  document.getElementById("userAddress").innerText =
    "Connected: " + shortAddress(address);
  document.getElementById("connectMessage").style.display = "none";
  document.getElementById("tweetForm").style.display = "block";
  displayTweets(address);
}

document
  .getElementById("connectWalletBtn")
  .addEventListener("click", connectWallet);

document.getElementById("tweetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = document.getElementById("tweetContent").value;
  const tweetSubmitButton = document.getElementById("tweetSubmitBtn");
  tweetSubmitButton.innerHTML = '<div class="spinner"></div>';
  tweetSubmitButton.disabled = true;
  try {
    await createTweet(content);
  } catch (error) {
    console.error("Error sending tweet:", error);
  } finally {
    // Restore the original button text
    tweetSubmitButton.innerHTML = "Tweet";
    tweetSubmitButton.disabled = false;
  }
});
