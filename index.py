
import qrcode
import numpy as np
from PIL import Image, ImageDraw
import math

data = "https://google.com"

qr = qrcode.QRCode(
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=15,
    border=4
)
qr.add_data(data)
qr.make(fit=True)

matrix = np.array(qr.get_matrix())
h, w = matrix.shape

cell = 15
img = Image.new("RGB", (w*cell, h*cell), "white")
draw = ImageDraw.Draw(img)

def heart(x, y):
    x = (x - w/2) / (w/2)
    y = (h/2 - y) / (h/2)
    return (x*x + y*y - 1)**3 - x*x*y**3 <= 0

for y in range(h):
    for x in range(w):
        # Оставляем три угловых маркера
        finder = (
            (x < 9 and y < 9) or
            (x >= w-9 and y < 9) or
            (x < 9 and y >= h-9)
        )

        if matrix[y, x] and (heart(x, y) or finder):
            draw.rectangle(
                (x*cell, y*cell,
                 (x+1)*cell-1, (y+1)*cell-1),
                fill="#ff1744"
            )

img.save("heart_qr.png")
img.show()
