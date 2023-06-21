import decimal
import json
import os
import boto3
from botocore.exceptions import ClientError

table_name = os.environ['WEBSITE_SETTINGS_TABLE']
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(table_name)

def increment_hitcounter():
    try:
        response = table.update_item(
            Key={'settingsKey': 'hitcounter'},
            UpdateExpression='SET #val = if_not_exists(#val, :zero) + :inc',
            ExpressionAttributeNames={'#val': 'value'},
            ExpressionAttributeValues={':zero': 0, ':inc': 1},
            ReturnValues='UPDATED_NEW'
        )
        return response['Attributes']['value']
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None

def lambda_handler(event, context):
    hitcount = increment_hitcounter()

    if event['httpMethod'] == 'GET':
        return {
            'statusCode': 200,
            'body': json.dumps({'hitcount': hitcount}, cls=JSONEncoder),
            'headers': {
                "Access-Control-Allow-Origin" : "*", 
                "Access-Control-Allow-Credentials" : "true"
            }
        }

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)