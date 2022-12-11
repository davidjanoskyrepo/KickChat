// Callback function to observe chat message mutations
const chatMessageMutationCallback = function (mutationsList, observer) {
    //console.log("Detected chat mutation!");
    for (let mutation of mutationsList) {
        // Fires twice because of temp message
        const found = [];
        var added_nodes = mutation.addedNodes;
        for (const node of added_nodes) {
            if (!node.tagName) continue; // not an element
            if (node.id.startsWith("message-")) {
                var isStreamer = getIsStreamer(node);
                var isTemp = node.id.startsWith("message-temp");
                //console.log("Found message node");
                // Get all the descendants of type chat message text
                var messageNodes = getChatMessages(node);
                // Found a chat line
                // Push messageNode and isStreamer
                // Itterate over messageNodes
                for (const messageNode of messageNodes) {
                    found.push({ messageNode, isStreamer, isTemp });
                }
            }
        }
        found.forEach(processFilter);
    }
};
            
const delay = function (milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

// Function to press enter
const dispatchInputEvent = function (element) {
    // Click in text input area
    element.focus();
    // Send click
    element.click();

    var eventAttributes = {
        altKey: false,
        bubbles: true,
        cancelBubble: false,
        cancelable: true,
        charCode: 0,
        composed: true,
        ctrlKey: false,
        currentTarget: null,
        defaultPrevented: true,
        detail: 0,
        eventPhase: 0,
        isComposing: false,
        isTrusted: true,
        location: 0,
        metaKey: false,
        repeat: false,
        returnValue: false,
        shiftKey: false,
    }

    // Send input event
    var inputEvent = new KeyboardEvent('input', eventAttributes);
    element.dispatchEvent(inputEvent);
}

// Send chat message with delay async
const sendChatMessagesWithDelay = async function (chatInput, chatSubmitButton, messages) {
    // Send the chat messages
    for (const message of messages) {
        console.log("Sending chat message: " + message);
        // Send the chat command
        chatInput.value = message;
        dispatchInputEvent(chatInput);
        // Click chat submit button
        chatSubmitButton.click();
        // Add a delay
        console.log("Delaying for 1 second");
        await delay(1000);
    }
}
    
// Function to load the user's added emotes from chrome storage sync and combine with local emotes
const loadUserEmotes = function () {
    chrome.storage.sync.get(['emotes'], function (result) {
        if (result.emotes) {
            // The user's emotes
            var userEmotes = JSON.parse(result.emotes);
            // Add all user emotes to the local emotes
            for (const [key, value] of Object.entries(userEmotes)) {
                emotes[key] = value;
            }
        }
    });
}

// Function to store a new user emote to chrome storage sync
const storeUserEmote = function (emoteName, emoteUrl) {
    // Emote entry
    var userEmote = { emoteName: emoteUrl };
    chrome.storage.sync.get(['emotes'], function (result) {
        if (result.emotes) {
            // The user's emotes
            var userEmotes = JSON.parse(result.emotes);
            // Add the new emote to the user's emotes
            userEmotes[emoteName] = emoteUrl;
            // Store the new emotes
            chrome.storage.sync.set({ emotes: JSON.stringify(userEmotes) });
        } else {
            // Store the new emotes
            chrome.storage.sync.set({ emotes: JSON.stringify(userEmote) });
        }
    });
}

// Function to remove a user emote from chrome storage sync
const removeUserEmote = function (emoteName) {
    chrome.storage.sync.get(['emotes'], function (result) {
        if (result.emotes) {
            // The user's emotes
            var userEmotes = JSON.parse(result.emotes);
            // Remove the emote from the user's emotes
            delete userEmotes[emoteName];
            // Store the new emotes
            chrome.storage.sync.set({ emotes: JSON.stringify(userEmotes) });
        }
    });
}

const insertAfter = function (newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

// Function to detect if live
const getIsLive = function () {
    // Get the live indicator
    // xpathElsLive for element of Live
    const xpathElsLive = "//*[@id='main-view']/div/div/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/span";

    // contextNode
    var contextNode = document;
    // namespaceResolver
    var namespaceResolver = null;
    // resultType of any
    var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
    // result
    var live = document.evaluate(xpathElsLive, contextNode, namespaceResolver, resultType, null);

    // Check if live
    if (live && live.singleNodeValue) {
        // Live
        return true;
    } else {
        // Not live
        return false;
    }
}

// Function to detect if offline
const getIsOffline = function () {
    // Get the offline indicator
    // xpathElsOffline for element of Offline
    const xpathElsOffline = "//*[@id='main-view']/div/div/div[1]/div/div[1]/div[3]/div[2]/div/div[1]/div[1]/div";

    // contextNode
    var contextNode = document;
    // namespaceResolver
    var namespaceResolver = null;
    // resultType of any
    var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
    // result
    var offline = document.evaluate(xpathElsOffline, contextNode, namespaceResolver, resultType, null);

    // Check if offline
    if (offline && offline.singleNodeValue) {
        // Offline
        return true;
    } else {
        // Not offline
        return false;
    }
}
    
// Function to get chat area
const getChatArea = function (other) {
    // Get the chat area
    // contextNode
    var contextNode = document;
    // namespaceResolver
    var namespaceResolver = null;
    // resultType of any
    var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;

    // check if live found
    if (!other) {
        // xpathExpression for path to chat area
        var xpathExpression = "//*[@id='main-view']/div/div/div[2]/div/div/div/div/div[2]/div[2]/div";
    } else {
        // xpathExpression for path to chat area
        var xpathExpression = "//*[@id='main-view']/div/div/div[2]/div/div/div/div/div[3]/div[2]/div";
    }

    // result
    var chatArea = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, null);

    // Check if chat button is found
    if (chatArea && chatArea.singleNodeValue) {
        //console.log("Found chat area!");
        //console.log(chatArea.singleNodeValue);
        return chatArea.singleNodeValue;
    } else if (!other) {
        console.log("Chat area not found, trying again...");
        var chatAreaOther = getChatArea(true);
        return chatAreaOther;
    } else {
        // Log the error
        console.log("Error: Could not find chat area!");
        return null;
    }
}

// Function to get chat input area
const getChatInputArea = function (other) {
    // contextNode
    var contextNode = document;
    // namespaceResolver
    var namespaceResolver = null;
    // resultType of any
    var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;

    // check if live found
    if (!other) {
        // xpathExpression for path to chat area
        var xpathExpression = "//*[@id='main-view']/div/div/div[2]/div/div/div/div/div[2]/div[3]/div/form";
    } else {
        // xpathExpression for path to chat area
        var xpathExpression = "//*[@id='main-view']/div/div/div[2]/div/div/div/div/div[3]/div[3]/div/form";
    }

    // result
    var chatInputArea = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, null);

    // Check if chat button is found
    if (chatInputArea && chatInputArea.singleNodeValue) {
        //console.log("Found chat input area!");
        //console.log(chatInputArea);
        return chatInputArea.singleNodeValue;
    } else if (!other) {
        console.log("Chat input area not found, trying again...");
        var chatInputAreaOther = getChatInputArea(true);
        return chatInputAreaOther;
    } else {
        // Log the error
        console.log("Error: Could not find chat input area!");
        return null;
    }
}

// Function to get chat messages
const getChatMessages = function (contextNode) {
    // Get the chat messages
    // xpathEls for elements of chat messages
    const xpathEls = ".//span[@class='break-words']";
    // namespaceResolver
    var namespaceResolver = null;
    // resultType of any
    var resultType = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
    // result
    var chatMessages = document.evaluate(xpathEls, contextNode, namespaceResolver, resultType, null);

    var chatMessagesArr = [];

    // Itterate over all chat messages and add them to the list
    var chatMessage = chatMessages.iterateNext();
    while (chatMessage) {
        chatMessagesArr.push(chatMessage);
        chatMessage = chatMessages.iterateNext();
    }

    return chatMessagesArr;
}

// Function to get streamer icon if exists
const getIsStreamer = function (contextNode) {
    //*[@id="Capa_1"]
    // xpathExpression for path to icon
    const xpathExpression = "//*[@id='Capa_1']";
    // namespaceResolver
    var namespaceResolver = null;
    // resultType of any
    var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
    // result
    var streamerIcon = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, null);

    //console.log(streamerIcon.singleNodeValue);

    // Check if chat button is found
    if (streamerIcon && streamerIcon.singleNodeValue && (streamerIcon.singleNodeValue.id === "Capa_1")) {
        return true;
    } else {
        return false;
    }
}

// Function to get chat submit button
const getChatSubmitButton = function () {
    // xpathExpression for path to chat submit button that contains class btn and btn--primary
    var xpathExpression = ".//div[2]/button";
    // contextNode
    var contextNode = getChatInputArea(false);
    console.log(contextNode);
    // check if chat input area not found
    if (!contextNode) {
        // Log the error
        console.log("Error: Could not find chat input area!");
        return null;
    }
    // namespaceResolver
    var namespaceResolver = null;
    // resultType of any
    var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
    // result
    var chatButton = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, null);

    // Check if chat button is found
    if (chatButton.singleNodeValue) {
        //console.log("Found chat submit button!");
        //console.log(chatButton);
        console.log(chatButton.singleNodeValue);
        return chatButton.singleNodeValue;
    } else {
        // Log the error
        console.log("Error: Could not find chat submit button!");
        return null;
    }
}

// Function to get chat submit button
const getChatInput = function () {
    // check if live found
    // class="chat-input"
    const xpathExpression = ".//*[@class='chat-input']";
    // contextNode
    var contextNode = getChatInputArea(false);
    // check if chat input area not found
    if (!contextNode) {
        // Log the error
        console.log("Error: Could not find chat input area!");
        return null;
    }
    // namespaceResolver
    var namespaceResolver = null;
    // resultType of any
    var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
    // result
    var chatInput = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, null);

    // Check if chat button is found
    if (chatInput.singleNodeValue) {
        //console.log("Found chat input!");
        //console.log(chatInput);
        return chatInput.singleNodeValue;
    } else {
        // Log the error
        console.log("Error: Could not find chat input!");
        return null;
    }
}

// Function to get emoji mart
const getEmojiMart = function () {
    // Get the emoji mart
    // xpathExpression for path to emoji mart
    var xpathExpression = "//*[@id='emoji-mart-list']";
    // contextNode
    var contextNode = document;
    // namespaceResolver
    var namespaceResolver = null;
    // resultType of any
    var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
    // result
    var emojiMart = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, null);


    // Check if chat button is found
    if (emojiMart.singleNodeValue) {
        //console.log("Found emoji mart!");
        //console.log(emojiMart);
        return emojiMart.singleNodeValue;
    } else {
        // Log the error
        console.log("Error: Could not find emoji mart!");
        return null;
    }
}

// Function to create emoji mart section and add all emotes
const createEmojiMartSection = function () {
    console.log("Creating KickChat emoji mart section!");
    // Create section element
    var emojiMartSection = document.createElement("section");
    // Set the aria label
    emojiMartSection.setAttribute("aria-label", "KickChat Emotes");
    // Set the class
    emojiMartSection.setAttribute("class", "emoji-mart-category");

    // Append div for h3
    var div = document.createElement("div");
    // Set the class
    div.setAttribute("class", "emoji-mart-category-label");
    // Append h3
    var h3 = document.createElement("h3");
    // Set the class
    h3.setAttribute("class", "emoji-mart-category-label");
    // Set the text
    h3.innerText = "KickChat Emotes";
    // Append h3 to div
    div.appendChild(h3);
    // Append div to emojiMartSection
    emojiMartSection.appendChild(div);

    // Iterate over all emotes in dictionary and append a button
    for (var emote in emotes) {
        // Create button element
        var button = document.createElement("button");
        // Set the class
        button.setAttribute("class", "emoji-mart-emoji");
        // Set the type
        button.setAttribute("type", "button");
        // Set the title
        button.setAttribute("title", emote);
        // Register on click listener
        button.addEventListener("click",
            function addEmoteToChatInput(event) {
                // Get emote name from target of event
                var emoteName = event.target.title;
                console.log(emoteName);
                //console.log(event);
                // Get document from event
                var document = event.target.ownerDocument;
                // Get the chat input
                
                // contextNode
                var contextNode = document;
                // namespaceResolver
                var namespaceResolver = null;
                // resultType of any
                var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;

                // Get the live indicator
                // xpathElsLive for element of Live
                const xpathElsLive = "//*[@id='main-view']/div/div/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/span";

                // contextNode
                contextNode = document;
                // namespaceResolver
                var namespaceResolver = null;
                // resultType of any
                var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
                // result
                var live = document.evaluate(xpathElsLive, contextNode, namespaceResolver, resultType, null);

                // Check if live
                if (live && live.singleNodeValue) {
                    // Live
                    var isLive = true;
                } else {
                    // Not live
                    var isLive = false;
                }

                // Get the offline indicator
                // xpathElsOffline for element of Offline
                const xpathElsOffline = "//*[@id='main-view']/div/div/div[1]/div/div[1]/div[3]/div[2]/div/div[1]/div[1]/div";

                // contextNode
                contextNode = document;
                // namespaceResolver
                var namespaceResolver = null;
                // resultType of any
                var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
                // result
                var offline = document.evaluate(xpathElsOffline, contextNode, namespaceResolver, resultType, null);

                // Check if offline
                if (offline && offline.singleNodeValue) {
                    // Offline
                    var isOffline = true;
                } else {
                    // Not offline
                    var isOffline = false;
                }

                // check if live found
                if (!isLive && !isOffline) {
                    console.log("Waiting for channel status");
                    return null;
                }

                // xpathExpression for path to chat area
                var xpathExpression = "//*[@id='main-view']/div/div/div[2]/div/div/div/div/div[2]/div[3]/div/form";
                
                // result
                var chatInputArea = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, null);

                // Check if chat button is found
                if (chatInputArea.singleNodeValue) {
                    //console.log("Found chat input area!");
                    //console.log(chatInputArea);
                    // contextNode
                    contextNode = chatInputArea.singleNodeValue;
                } else {
                    // xpathExpression for path to chat area
                    xpathExpression = "//*[@id='main-view']/div/div/div[2]/div/div/div/div/div[3]/div[3]/div/form";
                    // result
                    var chatInputArea = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, null);

                    if (chatInputArea.singleNodeValue) {
                        //console.log("Found chat input area!");
                        //console.log(chatInputArea);
                        // contextNode
                        contextNode = chatInputArea.singleNodeValue;
                    } else {
                        // Log the error
                        console.log("Error: Could not find chat input area!");
                        return null;
                    }
                }

                // xpathExpression for path to chat submit button that contains class btn and btn--primary
                var xpathExpression = ".//*[@class='chat-input']";
                // namespaceResolver
                var namespaceResolver = null;
                // resultType of any
                var resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
                // result
                var chatInput = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, null);

                // Check if chat button is found
                if (chatInput.singleNodeValue) {
                    //console.log("Found chat input!");
                    //console.log(chatInput);
                    var chatInputNode = chatInput.singleNodeValue;
                } else {
                    // Log the error
                    console.log("Error: Could not find chat input!");
                    return null;
                }

                // Get the current value
                var currentValue = chatInputNode.value;
                // Create the new value
                // Check if last character is " " and add " " if not
                // Check if currentValue empty
                if (currentValue.length > 0) {
                    var newValue = currentValue + (currentValue[currentValue.length - 1] === " " ? "" : " ") + emoteName + " ";
                } else {
                    var newValue = emoteName + " ";
                }
                // Set the new value
                chatInputNode.value = newValue;
                // Create input event
                // Click in text input area
                chatInputNode.focus();
                // Send click
                chatInputNode.click();

                var eventAttributes = {
                    altKey: false,
                    bubbles: true,
                    cancelBubble: false,
                    cancelable: true,
                    charCode: 0,
                    composed: true,
                    ctrlKey: false,
                    currentTarget: null,
                    defaultPrevented: true,
                    detail: 0,
                    eventPhase: 0,
                    isComposing: false,
                    isTrusted: true,
                    location: 0,
                    metaKey: false,
                    repeat: false,
                    returnValue: false,
                    shiftKey: false,
                };

                // Send input event
                var inputEvent = new KeyboardEvent('input', eventAttributes);
                chatInputNode.dispatchEvent(inputEvent);
                console.log("Sent input event!");
            }
        );
            
        // Set the data-emote
        button.setAttribute("data-emote", emote);
        // Set the data-emote
        button.setAttribute("data-emote-url", emotes[emote]);
        // Set the role as option
        button.setAttribute("role", "option");
        // Set aria selected as false
        button.setAttribute("aria-selected", "false");
        // Set data-title as emote
        button.setAttribute("data-title", emote);

        // Create a span
        var span = document.createElement("span");
        // Set the class
        span.setAttribute("class", "emoji-type-image");
        // Set height and width to 24px
        span.setAttribute("height", "24px");
        span.setAttribute("width", "24px");
        // Set style
        span.setAttribute("style", "background-position: 53.33% 33.33%;");

        // Append img
        var img = document.createElement("img");
        // Set the src
        img.setAttribute("src", emotes[emote]);
        // Set the alt
        img.setAttribute("alt", emote);
        // Set title to emote
        img.setAttribute("title", emote);
        // Set height and width to 24px
        img.setAttribute("height", "24px");
        img.setAttribute("width", "24px");

        // Append img to span
        span.appendChild(img);
        // Append img to button
        button.appendChild(span);
        // Append button to emojiMartSection
        emojiMartSection.appendChild(button);
    }


    // Get emoji mart and add this section to the front
    var emojiMart = getEmojiMart();

    // Check if emojiMart not null
    if (!emojiMart) {
        // Log error
        console.log("Could not get emoji mart!");
        return;
    }

    emojiMart.insertBefore(emojiMartSection, emojiMart.firstChild);
}

const processFilter = function (args) {
    // Unpack args
    var messageNode = args.messageNode;
    var isStreamer = args.isStreamer;
    var isTemp = args.isTemp;
    // Return if messageNode or messageNode.innerText is null or undefined
    if (!messageNode || !messageNode.innerText) return;

    // Check if streamer
    if (isStreamer && !isTemp) {
        console.log("Is Streamer : " + isStreamer);

        if (messageNode.innerText.startsWith(addCmd)) {
            console.log("Found Add Command");
            var cmdTokens = messageNode.innerText.split(" ");
            if (cmdTokens.length == 3) {
                var emoteName = cmdTokens[1];
                // Prevent adding anything that starts with cmdSymbol as an emote
                if (emoteName.startsWith(cmdSymbol)) {
                    // Cancel the emote addition and log through messageNode
                    messageNode.innerText = "Emote name cannot start with " + cmdSymbol;
                    return;
                }
                var emoteUrl = cmdTokens[2];
                // Check for duplication
                if (emotes[emoteName]) {
                    // Duplicate emote
                    messageNode.innerText = "Duplicate emote: " + emoteName;
                } else {
                    // Store the user emote
                    storeUserEmote(emoteName, emoteUrl);
                    emotes[emoteName] = emoteUrl;
                    messageNode.innerText = "Added emote: " + emoteName;
                }
            }
            return;
        }

        if (messageNode.innerText.startsWith(removeCmd)) {
            console.log("Found Remove Command");
            var cmdTokens = messageNode.innerText.split(" ");
            if (cmdTokens.length == 2) {
                var emoteName = cmdTokens[1];
                // Check if emote exists
                if (emotes[emoteName]) {
                    // Remove the user emote
                    removeUserEmote(emoteName, emoteUrl);
                    delete emotes[emoteName];
                    messageNode.innerText = "Removed emote: " + emoteName;
                } else {
                    // Emote does not exist
                    messageNode.innerText = "Emote does not exist: " + emoteName;
                }
            }
            return;
        }

        // Handle shareCmd
        if (messageNode.innerText.startsWith(shareCmd)) {
            console.log("Found Share Command");
            var cmdTokens = messageNode.innerText.split(" ");
            // Check that length is less than or equal to 2
            if (cmdTokens.length <= 2) {
                // Get chat submit button
                var chatSubmitButton = getChatSubmitButton();
                console.log(chatSubmitButton);
                if (chatSubmitButton) {
                    // Send chat command for this emote to add
                    // Send the chat command
                    var chatInput = getChatInput();
                    // Check that chat input exists
                    if (chatInput) {
                        if (cmdTokens.length == 1) {
                            // Send chat command for every user emote to add
                            var messages = []
                            for (const [key, value] of Object.entries(emotes)) {
                                var message = addCmd + " " + key + " " + value;
                                // Append message to messages
                                messages.push(message);
                            }
                            sendChatMessagesWithDelay(chatInput, chatSubmitButton, messages);
                        } else {
                            // Use second token as emote name
                            var emoteName = cmdTokens[1];
                            // Check that emote exists
                            if (emotes[emoteName]) {
                                // Get emote url
                                var emoteUrl = emotes[emoteName];
                                chatInput.value = addCmd + " " + emoteName + " " + emoteUrl;
                                dispatchInputEvent(chatInput);
                                // Click chat submit button
                                chatSubmitButton.click();
                                console.log("Shared emote : " + key);
                            } else {
                                // Log error
                                messageNode.innerText = "Error: Emote does not exist for sharing";
                            }
                        }
                    } else {
                        // Log error
                        messageNode.innerText = "Error: Could not find chat input";
                    }
                } else {
                    // Log error
                    messageNode.innerText = "Error: Could not find chat submit button";
                }
            } else {
                // Log error
                messageNode.innerText = "Error: Too many tokens for sharing";
            }
            return;
        }

        // Handle send command
        if (messageNode.innerText.startsWith(sendCmd)) {
            console.log("Found Send Command!");
            var cmdTokens = messageNode.innerText.split(" ");
            // Check that innexr text is command
            if (messageNode.innerText === sendCmd) {
                // Get chat submit button
                var chatSubmitButton = getChatSubmitButton();
                //console.log(chatSubmitButton);
                if (chatSubmitButton) {
                    // Send chat command for this emote to add
                    // Send the chat command
                    var chatInput = getChatInput();
                    // Check that chat input exists
                    if (chatInput) {
                        // Send a test message to chat
                        chatInput.value = "Test Message";
                        dispatchInputEvent(chatInput);
                        // Click chat submit button
                        chatSubmitButton.click();
                        console.log("Sent test message");
                    } else {
                        // Log error
                        messageNode.innerText = "Error: Could not find chat input";
                    }
                } else {
                    // Log error
                    messageNode.innerText = "Error: Could not find chat submit button";
                }
            }
            return;
        }
    }
    
    // Do things with a chat here

    // Get the chat message text
    var messageText = messageNode.innerText;
    // Split the message text into tokens
    var messageTokens = messageText.split(" ");
    // For token in message_tokens if token is in emotes then update messageNode with emote otherwise add it to span
    var span = document.createElement("span");
    span.className = "emote-message";
    // Var to hold combined tokens that are not emotes
    var combinedToken = "";
    messageTokens.forEach(function (token) {
        // Check if token is an emote
        if (token in emotes) {
            // Token is an emote
            console.log("Found emote: " + token);
            // If combinedToken is not empty then add it to chat node
            if (combinedToken !== "") {
                span.appendChild(document.createTextNode(combinedToken));
                combinedToken = "";
            }
            // Add the emote
            var img = document.createElement("img");
            img.src = emotes[token];
            img.style.height = "28px";
            img.style.width = "28px";
            img.style.verticalAlign = "middle";
            img.style.display = "inline";
            // Add a little padding to this image
            img.style.padding = "2px";
            img.alt = token;
            span.appendChild(img);
        } else {
            // Add the text and space to combinedToken
            combinedToken += token + " ";
        }
    });
    // Add remaining combinedText
    if (combinedToken !== "") {
        span.appendChild(document.createTextNode(combinedToken));
    }
    // Replace the messageNode with the span
    messageNode.replaceWith(span);
}

// Function to detect url change in webpage
const detectForUrlChange = async function (checkFrequencyInMs) {
    //console.log("Checking for url change from : " + lastUrl);
    // Get the webpage url
    var url = window.location.href;
    // Check if new url is different from the last url
    if (url != lastUrl) {
        // Update lastUrl
        lastUrl = url;
        // Check if the url is a kick chat url
        if (url.includes("kick.com")) {
            console.log("Detected url change to : " + url + "!");
            await waitForChatToLoad(checkFrequencyInMs);
        }
    }
}

// Function to wait for chat to load
const waitForChatToLoad = async function (checkFrequencyInMs) {
    // Clear observer
    observer.disconnect();
    // Do something every checkFrequencyInMs 15 times
    var count = 0;
    for (var i = 0; i < 15; i++) {
        console.log("Checking for chat load");
        // Check if the chat is loaded
        var chatRoomNode = getChatArea(false);
        if (chatRoomNode != null) {
            // Chat is loaded
            console.log("Chat is loaded!");
            // Stop checking
            // Start observing the target node for configured mutations
            // Update the observer with new chatRoomNode
            observer.observe(chatRoomNode, config);
            // Add emotes to emoji mart
            createEmojiMartSection();
            return;
        }
        // Check if we have checked 15 times
        if (count >= 15) {
            // Stop checking
            return;
        }
        count++;
        await delay(checkFrequencyInMs);
    }
}

// Function to call waitForElementToDisplay or wait for a url change
const waitForChat = async function (checkFrequencyInMs) {
    // Try to get chat on page load
    console.log("Checking for chat load on page load");
    await waitForChatToLoad(checkFrequencyInMs);
    // Detect a url change
    lastUrl = window.location.href;
    console.log("Initial url : " + lastUrl);
    console.log("Beging polling for url change ...");
    // Forever loop
    while (true) {
        // Check for url change
        await detectForUrlChange(checkFrequencyInMs);
        await delay(checkFrequencyInMs);
    }
}

// Make main function and set emotes
const main = async function () {
    // Return if blank page
    if (window.location.href == "about:blank") return;
    local_emotes = {
        "GambaPls": "https://i.imgur.com/2Ev1Ks5.png",
        "PinkCass": "https://i.imgur.com/ovEJGPc.png",
        "PinkAta": "https://i.imgur.com/dqW7htV.png",
        "PinkWow": "https://i.imgur.com/G4LwEWq.png",
        "PinkDColon": "https://i.imgur.com/XXofcxt.png",
        "Dance": "https://cdn.betterttv.net/emote/5d9585231df66f68c80c6f26/3x",
        "Wat": "https://i.imgur.com/suaoaA8.gif",
        "Noted": "https://i.imgur.com/M5MbbRU.gif",
        "Cry": "https://i.imgur.com/pn4VloK.gif",
        "Booba": "https://i.imgur.com/gCCer9w.gif",
        "RipBozo": "https://i.imgur.com/f3z6uz2.gif",
        "Unknown": "https://i.imgur.com/iHpjYo9.png",
        "Poggies": "https://i.imgur.com/hGCzagf.gif",
        "Metro": "https://i.imgur.com/WVSfpH4.gif",
        "GigaChad": "https://i.imgur.com/FFyB2GV.gif",
        "Muted": "https://i.imgur.com/J0Rs4Xj.gif",
        "DvaAss": "https://i.imgur.com/mwuYYvE.gif",
        "Vibe": "https://i.imgur.com/CTxodIN.gif",
        "Huh": "https://i.imgur.com/VkNYav3.gif",
        "Peep": "https://i.imgur.com/Tuph58k.gif",
        "Hypers": "https://i.imgur.com/BQZtxzw.gif"
    }
    // Add local emote list to global emote list
    emotes = { ...emotes, ...local_emotes };
    // Load the user's emote's and update global emote list
    loadUserEmotes();

    // Call waitForChat
    await waitForChat(1000);
}

const cmdSymbol = "^"
const addCmd = cmdSymbol + "AddEmote";
const removeCmd = cmdSymbol + "RemoveEmote";
const shareCmd = cmdSymbol + "ShareEmotes";
const sendCmd = cmdSymbol + "SendTest";

var emotes = {};

// var to hold updates to url
var lastUrl = "";

// Create an observer instance bound to callback
var observer = new MutationObserver(chatMessageMutationCallback);

// Options for the observer (which mutations to observe)
const config = { childList: true };

// Call main function
main();
