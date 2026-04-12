"""Shared R2 upload utility for buildathon Modal services."""
import os
import io

_s3_client = None


def _get_client():
    global _s3_client
    if _s3_client is None:
        import boto3

        r2_account_id = os.environ.get("R2_ACCOUNT_ID")
        r2_access_key = os.environ.get("R2_ACCESS_KEY_ID")
        r2_secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")

        if not all([r2_account_id, r2_access_key, r2_secret_key]):
            raise RuntimeError("R2 credentials not configured")

        _s3_client = boto3.client(
            "s3",
            endpoint_url=f"https://{r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=r2_access_key,
            aws_secret_access_key=r2_secret_key,
            region_name="auto",
        )
    return _s3_client


def upload_bytes_to_r2(data: bytes, key: str, content_type: str = "application/octet-stream") -> str:
    r2_bucket = os.environ.get("R2_BUCKET_NAME", "buildathon")
    s3 = _get_client()

    s3.upload_fileobj(
        io.BytesIO(data),
        r2_bucket,
        key,
        ExtraArgs={"ContentType": content_type},
    )
    print(f"R2: uploaded {key} ({len(data)} bytes)")
    return key
