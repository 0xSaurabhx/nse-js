const { NSE, Extras } = require('./index');
const { DateTime } = require('luxon');
const nse = new NSE();
const ex = new Extras("./");

async function testStatus() {
  try {
    const result = await nse.status()
    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testBhavcopy() {
  try {
    const result = await ex.deliveryBhavcopy(DateTime.now(),"./");
    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testStatus();

testBhavcopy();