export async function signDataWithNCALayer(dataToSign: string): Promise<string> {
  const address = "127.0.0.1:13579";
  const xmlToSign = `<auth><nonce>${dataToSign}</nonce></auth>`;
  
  const request = {
    module: "kz.gov.pki.knca.commonUtils",
    method: "signXml",
    args: ["PKCS12", "AUTHENTICATION", xmlToSign, "", ""]
  };

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`wss://${address}/`);

    socket.onopen = () => {
      console.log("📡 Подключение к WebSocket Layer... Отправка signXml");
      socket.send(JSON.stringify(request));
    };

    socket.onmessage = (event) => {
      try {
        const res = JSON.parse(event.data.toString());
        if (res.result && res.result.version) return;

        console.log("📥 Ответ от NCALayer:", res);

        if (res.code === "200") {
          // ВАЖНО: берем responseObject, так как твоя версия присылает данные именно туда
          const signature = res.responseObject || res.result;
          
          if (signature) {
            console.log("✅ XML успешно подписан!");
            resolve(signature);
          } else {
            reject(new Error("NCALayer вернул успех, но данные подписи пусты"));
          }
          socket.close();
        } else if (res.code === "100") {
          reject(new Error("Выбор ключа отменен"));
          socket.close();
        } else {
          reject(new Error(res.message || `Ошибка: ${res.code}`));
          socket.close();
        }
      } catch (err) {
        reject(new Error("Ошибка парсинга ответа"));
        socket.close();
      }
    };

    socket.onerror = () => reject(new Error("NCALayer не запущен"));
  });
}