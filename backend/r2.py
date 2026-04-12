import boto3
import os

R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
BUCKET = os.environ.get("R2_BUCKET_NAME", "buildathon")

s3 = None
if R2_ACCOUNT_ID and R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY:
    s3 = boto3.client("s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )

def r2_upload(key: str, data: bytes, content_type: str):
    if not s3:
        print("S3 client not initialized. Skipping upload.")
        return
    import io
    s3.upload_fileobj(io.BytesIO(data), BUCKET, key, ExtraArgs={"ContentType": content_type})

def r2_presigned_url(key: str, expires: int = 3600) -> str:
    if not s3:
        return ""
    return s3.generate_presigned_url("get_object", Params={"Bucket": BUCKET, "Key": key}, ExpiresIn=expires)
