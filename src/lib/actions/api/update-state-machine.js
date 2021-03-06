const aslValidator = require('asl-validator');

const { isValidArn } = require('../../tools/validate');
const { errors, parameters } = require('../../../constants');

// TODO: throw STATE_MACHINE_DELETING if specified state machine is being deleted

function updateStateMachine(params, stateMachines) {
  /* check request parameters */
  if (!params.roleArn && !params.definition) {
    throw new Error(`${errors.common.MISSING_REQUIRED_PARAMETER}: --role-arn or --definition`);
  }
  if (typeof params.stateMachineArn !== 'string'
    || params.stateMachineArn.length < parameters.arn.MIN
    || params.stateMachineArn.length > parameters.arn.MAX
  ) {
    throw new Error(`${errors.common.INVALID_PARAMETER_VALUE}: --state-machine-arn`);
  }
  if (params.roleArn &&
    (typeof params.roleArn !== 'string'
    || params.roleArn.length < parameters.arn.MIN
    || params.roleArn.length > parameters.arn.MAX)
  ) {
    throw new Error(`${errors.common.INVALID_PARAMETER_VALUE}: --role-arn`);
  }
  if (params.definition &&
    (typeof params.definition !== 'string'
    || params.definition.length < parameters.definition.MIN
    || params.definition.length > parameters.definition.MAX)
  ) {
    throw new Error(`${errors.common.INVALID_PARAMETER_VALUE}: --definition`);
  }

  /* execute action */
  if (!isValidArn(params.stateMachineArn, 'state-machine')) {
    throw new Error(`${errors.updateStateMachine.INVALID_ARN}: --state-machine-arn`);
  }
  const index = stateMachines.findIndex(o => o.stateMachineArn === params.stateMachineArn);
  if (index === -1) {
    throw new Error(errors.updateStateMachine.STATE_MACHINE_DOES_NOT_EXIST);
  }
  const stateMachine = Object.assign({}, stateMachines[index], {
    updateDate: Date.now() / 1000,
  });
  if (params.definition) {
    let parsedDefinition;
    try {
      parsedDefinition = JSON.parse(params.definition);
    } catch (e) {
      throw new Error(`${errors.updateStateMachine.INVALID_DEFINITION}: INVALID_JSON_DESCRIPTION`);
    }
    const { isValid } = aslValidator(parsedDefinition);
    if (!isValid) {
      throw new Error(`${errors.updateStateMachine.INVALID_DEFINITION}: SCHEMA_VALIDATION_FAILED`);
    }
    stateMachine.definition = parsedDefinition;
  }
  if (params.roleArn) {
    if (!isValidArn(params.roleArn, 'role')) {
      throw new Error(`${errors.updateStateMachine.INVALID_ARN}: --role-arn`);
    }
    stateMachine.roleArn = params.roleArn;
  }

  return {
    index,
    stateMachine,
    response: {
      updateDate: stateMachine.updateDate,
    },
  };
}

module.exports = updateStateMachine;
