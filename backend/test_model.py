from ultralytics import YOLO
import glob
import os

# 1. 학습된 모델 불러오기
print(">>> 모델을 불러오는 중입니다...")
model = YOLO("./models/pill_detection.pt")

# 2. 테스트할 이미지 아무거나 하나 가져오기
# (학습에 안 쓴 val 폴더 이미지를 하나 가져옵니다)
img_dir = "../datasets/pill_aihub/yolo/images/val"
img_list = glob.glob(os.path.join(img_dir, "*.png"))

if not img_list:
    print("이미지 폴더가 비어있거나 경로가 틀렸습니다.")
else:
    test_img = img_list[0] # 첫 번째 사진 선택
    print(f">>> 테스트 이미지: {test_img}")

    # 3. 예측 실행 (Predict)
    results = model.predict(source=test_img, save=True, conf=0.5)

    # 4. 결과 알림
    print("\n>>> 🎉 예측 완료!")
    print(f"결과 이미지가 'runs/detect/predict...' 폴더에 저장되었습니다.")
    