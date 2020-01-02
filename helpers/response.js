class Response {
  constructor () {
    this.statusCode = null;
    this.type = null;
    this.data = null;
    this.message = null;
  }

  setSuccess(statusCode, message, data) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.type = "success";
  }

  setError(statusCode, message, data) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.type = "error";
  }

  send(res) {
    const result = {
      code: this.statusCode,
      message: this.message
    };
    if (this.statusCode == "200") {
      result.result = this.data;
      return res.status(200).json(result);
    }
     if (this.statusCode == "400") {
      result.result = this.data;
      return res.status(200).json(result);
    }

     if (this.statusCode == "500") {
       result.result = this.data;
      return res.status(this.statusCode).json(result);
    }
    
    return res.status(200).json(result);
  }
}

module.exports = Response
