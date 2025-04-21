import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

function QRCodeGenerator({ url, size = 256, includeMargin = true }) {
  return (
    <div className="flex flex-col items-center">
      <div className="p-4 bg-white rounded-lg shadow-md">
        <QRCodeSVG
          value={url}
          size={size}
          level="H" // High error correction capability
          includeMargin={includeMargin}
          imageSettings={{
            src: "",
            height: 24,
            width: 24,
            excavate: true,
          }}
        />
      </div>
      <p className="mt-2 text-center text-sm text-gray-500">Scan to join the queue</p>
    </div>
  );
}

export default QRCodeGenerator;
