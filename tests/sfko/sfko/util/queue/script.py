# Expects
# 4 KEYS, current_epoch, task_queue, results_queue, pending_tasks
# 2 ARGS, current_epoch, new_epoch
ROLL_EPOCH = '''
local epoch_key = KEYS[1]
local task_key = KEYS[2]
local results_key = KEYS[3]
local pending_key = KEYS[4]
local current_epoch = redis.call("GET", epoch_key)
if current_epoch == false or current_epoch == ARGV[1] then
	redis.call("SET", epoch_key, ARGV[2])
    redis.call("DEL", task_key)
    redis.call("DEL", results_key)
    redis.call("SET", pending_key, 0)
	return ARGV[2]
end
return current_epoch
'''

# Expects
# 2 KEYS, current_epoch and task queue
# Optional 3rd KEY, pending task key to decrement per addition
# 1 ARGS, Task to be added
QUEUE_ADD = '''
local epoch_key = KEYS[1]
local task_key = KEYS[2]
local pending_key = KEYS[3]
local current_epoch = redis.call("GET", epoch_key)
local provided_epoch = ARGV[1]
local added = 0
for i = 2, #ARGV do
    if provided_epoch == 'None' or provided_epoch == current_epoch then
        redis.call("RPUSH", task_key, cmsgpack.pack({ current_epoch, ARGV[i] }))
        if pending_key ~= nil then
            local pending = redis.call("DECR", pending_key)
            if pending < 0 then
                redis.call('SET', pending_key, 0)
            end
        end
        added = added + 1
    end
end
return added
'''

# Expects
# 2 KEYS, current_epoch and task queue
# Optional 3rd KEY, pending task key to increment
QUEUE_GET = '''
local epoch_key = KEYS[1]
local task_key = KEYS[2]
local pending_key = KEYS[3]
local current_epoch = redis.call("GET", epoch_key)
local task = nil
repeat
	task = redis.call("LPOP", task_key)
    if task ~= false then
        task = cmsgpack.unpack(task)
    end
until task == false or task[1] == current_epoch
if task == false then
	return false
end
if pending_key ~= nil then
    local pending = redis.call("INCR", pending_key)
    if pending <= 0 then
        redis.call("SET", pending_key, 1)
    end
end
return task
'''
