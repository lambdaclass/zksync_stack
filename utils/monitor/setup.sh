ZKSYNC_STACK_HOME=/home/admin/zksync_stack
git -C $ZKSYNC_STACK_HOME pull origin main --ff-only || git clone https://github.com/lambdaclass/zksync_stack.git $ZKSYNC_STACK_HOME
# Change when this feature is merged
git -C $ZKSYNC_STACK_HOME checkout feat_custom_monitor

cd $ZKSYNC_STACK_HOME/utils/monitor && bun i && cd -

sudo cp $ZKSYNC_STACK_HOME/utils/monitor/monitor.service /lib/systemd/system/
sudo systemctl enable monitor
sudo systemctl start monitor
