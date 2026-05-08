import json
import os
import tempfile
import boto3
from pdf2docx import Converter

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ.get('S3_BUCKET', 'navon-tech-images')

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
}


def handler(event, context):
    """Convert a PDF file in S3 to DOCX format."""

    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': ''
        }

    try:
        body = json.loads(event.get('body', '{}'))
        s3_key = body.get('s3Key')

        if not s3_key:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Missing s3Key parameter'})
            }

        # Validate it's a PDF
        if not s3_key.lower().endswith('.pdf'):
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'File is not a PDF'})
            }

        # Create temp files for conversion
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as pdf_tmp:
            pdf_path = pdf_tmp.name

        docx_path = pdf_path.replace('.pdf', '.docx')

        try:
            # Download PDF from S3
            s3_client.download_file(BUCKET_NAME, s3_key, pdf_path)

            # Convert PDF to DOCX
            cv = Converter(pdf_path)
            cv.convert(docx_path)
            cv.close()

            # Generate the DOCX S3 key (same folder, .docx extension)
            docx_s3_key = s3_key.rsplit('.', 1)[0] + '.docx'

            # Upload DOCX to S3
            s3_client.upload_file(
                docx_path,
                BUCKET_NAME,
                docx_s3_key,
                ExtraArgs={
                    'ContentType': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'ContentDisposition': f'attachment; filename="{os.path.basename(docx_s3_key)}"'
                }
            )

            # Build the S3 URL for the converted file
            region = os.environ.get('AWS_REGION', 'us-east-1')
            docx_url = f'https://{BUCKET_NAME}.s3.{region}.amazonaws.com/{docx_s3_key}'

            return {
                'statusCode': 200,
                'headers': HEADERS,
                'body': json.dumps({
                    'message': 'PDF converted to DOCX successfully',
                    'docxKey': docx_s3_key,
                    'docxUrl': docx_url
                })
            }

        finally:
            # Clean up temp files
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
            if os.path.exists(docx_path):
                os.unlink(docx_path)

    except s3_client.exceptions.NoSuchKey:
        return {
            'statusCode': 404,
            'headers': HEADERS,
            'body': json.dumps({'error': 'PDF file not found in S3'})
        }
    except Exception as e:
        print(f'Error converting PDF: {str(e)}')
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({
                'error': 'Failed to convert PDF to DOCX',
                'message': str(e)
            })
        }
