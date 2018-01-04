const express = require('express');
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');

const logger = require('./lib/logger')('stepfunctions-local');
const { actions, errors } = require('./constants');
const store = require('./store');

const listStateMachines = require('./lib/actions/list-state-machines');
const createStateMachine = require('./lib/actions/create-state-machine');
const deleteStateMachine = require('./lib/actions/delete-state-machine');
const describeStateMachine = require('./lib/actions/describe-state-machine');

const startExecution = require('./lib/actions/start-execution');
const stopExecution = require('./lib/actions/stop-execution');
const listExecutions = require('./lib/actions/list-executions');
const describeExecution = require('./lib/actions/describe-execution');
const getExecutionHistory = require('./lib/actions/get-execution-history');

function callAction(state, action, params) {
  switch (action) {
    // actions related to state machine
    case actions.CREATE_STATE_MACHINE:
      return createStateMachine(params, state.stateMachines);
    case actions.LIST_STATE_MACHINES:
      return listStateMachines(params, state.stateMachines);
    case actions.DESCRIBE_STATE_MACHINE:
      return describeStateMachine(params, state.stateMachines);
    case actions.UPDATE_STATE_MACHINE:
      // TODO
      return {};
    case actions.DELETE_STATE_MACHINE:
      return deleteStateMachine(params, state.stateMachines);
    // actions related to executions
    case actions.START_EXECUTION:
      return startExecution(params, state.stateMachines, state.executions);
    case actions.STOP_EXECUTION:
      return stopExecution(params, state.executions);
    case actions.LIST_EXECUTIONS:
      return listExecutions(params, state.stateMachines, state.executions);
    case actions.DESCRIBE_EXECUTION:
      return describeExecution(params, state.executions);
    case actions.GET_EXECUTION_HISTORY:
      return getExecutionHistory(params, state.executions);
    // actions related to activities
    case actions.CREATE_ACTIVITY:
      // TODO
      return {};
    case actions.GET_ACTIVITY_TASK:
      // TODO
      return {};
    case actions.LIST_ACTIVITIES:
      // TODO
      return {};
    case actions.SEND_TASK_FAILURE:
      // TODO
      return {};
    case actions.SEND_TASK_HEARTBEAT:
      // TODO
      return {};
    case actions.SEND_TASK_SUCCESS:
      // TODO
      return {};
    case actions.DELETE_ACTIVITY:
      // TODO
      return {};
    // default action
    default:
      return {
        response: {},
      };
  }
}

function start(config) {
  // Server creation
  const app = express();
  app.use(bodyParser.json({
    type: 'application/x-amz-json-1.0',
  }));

  app.post('/', (req, res) => {
    try {
      const target = req.headers['x-amz-target'];
      if (typeof target !== 'string') {
        return res.status(400).send({ error: 'Missing header x-amz-target' });
      }
      if (!target.startsWith('AWSStepFunctions.')) {
        return res.status(400).send({ error: 'Malformed header x-amz-target' });
      }
      const action = Object.keys(actions)
        .map(key => actions[key])
        .find(val => val === target.split('.')[1]);
      if (!action) {
        return res.status(400).send({ error: 'Unknown action' });
      }
      const requestId = uuidv4();
      logger.log('-> %s: %s %O', requestId, action, req.body);
      store.dispatch({
        type: action,
        requestId,
        result: callAction(store.getState(), action, req.body),
      });
      const response = store.getState().responses[requestId];
      store.dispatch({
        type: actions.REMOVE_RESPONSE,
        requestId,
      });
      if (response.err) {
        return res.status(400).send(response.err);
      }
      return res.send(response.data);
    } catch (e) {
      logger.error('Internal error: %O', e);
      return res.status(500).send({ error: errors.common.INTERNAL_ERROR });
    }
  });

  app.listen(config.port, () => {
    logger.log('stepfunctions-local started, listening on port %s', config.port);
  });
}

module.exports = {
  start,
};
