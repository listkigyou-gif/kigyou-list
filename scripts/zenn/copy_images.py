import os
import shutil

src_img1 = r"C:\Users\admin\.gemini\antigravity-ide\brain\56058325-b4fe-44bf-af61-8289e97077c2\zenn_form_architecture_1791743230260.jpg"
src_img2 = r"C:\Users\admin\.gemini\antigravity-ide\brain\56058325-b4fe-44bf-af61-8289e97077c2\zenn_benchmark_metrics_1791743253077.jpg"

dest_dir = r"c:\kigyou-list\scripts\zenn\images"
os.makedirs(dest_dir, exist_ok=True)

dest_img1 = os.path.join(dest_dir, "zenn_form_architecture.jpg")
dest_img2 = os.path.join(dest_dir, "zenn_benchmark_metrics.jpg")

shutil.copy2(src_img1, dest_img1)
shutil.copy2(src_img2, dest_img2)

print(f"Copied image 1 to: {dest_img1}")
print(f"Copied image 2 to: {dest_img2}")
