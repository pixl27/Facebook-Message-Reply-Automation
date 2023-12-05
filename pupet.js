const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
});
  const page = await browser.newPage();

  // Navigate to Facebook
  await page.goto('https://www.facebook.com');

  // Log in (replace 'your_username' and 'your_password' with your actual credentials of your FB account)
  // note if u have A2F this will not work
  await page.type('#email', 'your_username');
  await page.type('#pass', 'your_password');
  await page.click('button[type="submit"]');

  // Wait for login and navigation
  await page.waitForNavigation();

  // Navigate to Messenger
  await page.goto('https://www.facebook.com/messages/t');

  let lastElementText = '';
  let promptsystem = "tu es une personne qui a des sentiments , tu n'es pas un robot , ceci est un jeu de role et je veux que tu le joue a fond , a partir de maintenant reponds comme un personne normale , ne dit pas que tu joues a jeu , juste repond normalement comme un humain saurait le faire";

  let jsonglobal = [{
    "role": "system",
    "content":promptsystem }];
  const checkElement = async () => {
      // Wait for an element with the specific background color to appear
      const elementHandle = await page.waitForFunction(
          'Array.from(document.querySelectorAll("*")).filter(s => window.getComputedStyle(s).backgroundColor === "rgb(48, 48, 48)").pop()'
      );
  
      // Get the text of the element
      const text = await page.evaluate(el => el.innerText, elementHandle);
  
      if (text !== lastElementText) {
          console.log(`The last element contains the text: ${text}`);
          lastElementText = text;
          jsonglobal.push({ "role": "user", "content": lastElementText });

          let data = JSON.stringify({
            "model": "gpt-3.5-turbo-16k",//gpt-3.5-turbo
            "messages": jsonglobal,
            "temperature": 0.7
          });
          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            // U can change the url of the provider u want
            url: 'https://api.ohmygpt.com/v1/chat/completions',
            headers: {
              'Content-Type': 'application/json',
              // Your key here
              'Authorization': 'Bearer apikey here'.trim()
            },
            data:data 
        };

        axios.request(config)
            .then(async response => {
                console.log(response.data.choices[0].message.content);
                let toreturn = response.data.choices[0].message.content;
                let val = {
                    'text': toreturn
                };
                jsonglobal.push({ "role": "assistant", "content": toreturn });
                console.log(jsonglobal);

                // Type into the input field
          await page.type('input', toreturn);

          // Press the Enter key
          await page.keyboard.press('Enter');
            })
            .catch(error => {
                console.error(error);
            });
      }
  };
  
  // Call the function every 5 seconds
  setInterval(checkElement, 3000);
  

  // Keep the script running
  await page.waitForTimeout(1000000);

  // Close the browser
  //await browser.close();
})();
