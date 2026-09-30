class Arn {
  constructor ({ webhookUrl }) {
    this.webhookUrl = webhookUrl || '';
  }

  async callWebhook(labelValue) {
    const url = `${this.webhookUrl}?labelName=${labelValue}`
    console.log(`Call webhook ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {},
    });

    if (!response.ok) {
      const errorMsg = await response.text();

      throw new Error(errorMsg)
    }
  }
}

export default Arn;
