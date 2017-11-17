onmessage = function (msg) {
	if (msg.data.type == 'load'){
		var file = msg.data.file;
		var result = [];

		var reader = new FileReaderSync();
		var dataURL = reader.readAsDataURL(file);
		var dataText = reader.readAsText(file);
		postMessage({
			dataURL: dataURL,
			dataText: dataText
		});
	}
	else if (msg.data.type = 'download'){
		var data = reader.readAsText(file);
		var ciphers = data.split('?')[1];
		var filenames = data.split('?')[0];
		var arrCipher = ciphers.split(STR_SEPERATOR);
		var dataURL = [];
		for (var i = 0; i < arrCipher.length; i++) {
			cipher = arrCipher[i];
			var decrypted = CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8);
			dataURL.push(decrypted);
		}
		postMessage({
			dataURL: dataURL,
			filenames: filenames
		});
	}
}