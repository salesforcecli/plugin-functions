import { expect } from 'chai';
import 'mocha';
import { Context, DataApi, InvocationEvent, Logger, Org } from '@salesforce/salesforce-sdk';
import * as sinon from 'sinon';

import execute from '../dist';

/**
 * {{fnNameCased}} unit tests.
 */

 describe('Unit Tests', () => {

    let sandbox: sinon.SinonSandbox;
    let mockContext;
    let mockLogger;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockContext = sandbox.createStubInstance(Context);
        mockContext.org = sandbox.createStubInstance(Org);
        mockContext.org.data = sandbox.createStubInstance(DataApi);
        mockLogger = sandbox.createStubInstance(Logger);
        mockContext.logger = mockLogger;
    });

    afterEach(() => {
        sandbox.restore();
    });

     it('Invoke {{fnNameCased}}', async () => {
         // Mock Accounts query
        const accounts = {
            'totalSize':3,
            'done':true,
            'records':[
                {
                    'attributes':
                        {'type':'Account','url':'/services/data/v48.0/sobjects/Account/001xx000003GYNjAAO'},
                        'Name':'Global Media'
                },
                {
                    'attributes':
                        {'type':'Account','url':'/services/data/v48.0/sobjects/Account/001xx000003GYNkAAO'},
                        'Name':'Acme'
                },
                {
                    'attributes':
                    {'type':'Account','url':'/services/data/v48.0/sobjects/Account/001xx000003GYNlAAO'},
                    'Name':'salesforce.com'
                }
            ]
        };
        mockContext.org.data.query.callsFake(() => {
            return accounts;
        });

        // Invoke function
        const results = await execute({ data: {} } as InvocationEvent, mockContext, mockLogger);

        // Validate
        expect(mockContext.org.data.query.callCount).to.be.eql(1);
        expect(mockLogger.info.callCount).to.be.eql(2);
        expect(results).to.be.not.undefined;
        expect(results).has.property('totalSize');
        expect(results.totalSize).to.be.eq(accounts.totalSize);
    });
});
