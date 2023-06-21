import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import * as crypto from 'crypto';

export class XavierInThe90SStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a random alphanumeric string
    const randomString = crypto.randomBytes(3).toString('hex');

    // Create DynamoDB Table
    const websiteSettingsTable = new dynamodb.Table(this, 'websiteSettingsTable', {
      partitionKey: { name: 'settingsKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `xavierinthe90s_${randomString}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda function
    const lambdaFunction = new lambda.Function(this, 'lambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      handler: 'index.lambda_handler',
      environment: {
        'WEBSITE_SETTINGS_TABLE': websiteSettingsTable.tableName
      },
    });

    // Allow Lambda function to read/write to the table
    websiteSettingsTable.grantReadWriteData(lambdaFunction);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'websiteapi', {
      restApiName: 'WebsiteAPI',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [...apigateway.Cors.DEFAULT_HEADERS]
      },
    });

    const settings = api.root.addResource('settings');
    const hitcounter = settings.addResource('hitcounter');

    // Create integration
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    hitcounter.addMethod('GET', lambdaIntegration);

  }
}