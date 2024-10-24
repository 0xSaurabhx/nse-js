const NSE = require('./index');
const nse = new NSE();

async function testStatus() {
  try {
    const result = await nse.status();
    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testStatus();