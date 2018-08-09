            MASTER=`redis-cli -h {{ template "redis-ha.fullname" . }} -p {{ .Values.sentinel.port }} sentinel get-master-addr-by-name {{ .Values.redis.masterGroupName }} | grep -E '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}'`
            OLD_IP=`cat /data/conf/ip`
            REDIS_CONF=/data/conf/redis.conf
            SENTINEL_CONF=/data/conf/sentinel.conf
            R_PATCH=/data/conf/redis.patch
            S_PATCH=/data/conf/sentinel.patch

            set -ex
            mkdir -p /data/conf/
            echo "Initializing config.."

            if [[ ! -f $REDIS_CONF && ! -f SENTINEL_CONF ]]; then
                cp /readonly-config/redis.conf $REDIS_CONF
                cp /readonly-config/sentinel.conf $SENTINEL_CONF
            else
                #sleep 600
                if [[ `diff -u /readonly-config/redis.conf $REDIS_CONF > $R_PATCH` ]]; then
                    echo "Found diff with Redis settings, patching with new config"
                    patch $REDIS_CONF -i $R_PATCH
                    rm $R_PATCH
                fi
                if [[ `diff -u /readonly-config/sentinel.conf $SENTINEL_CONF > $S_PATCH` ]]; then
                    echo "Found diff with Sentinel settings, patching with new config"
                    patch $SENTINEL_CONF -i $S_PATCH
                    rm $S_PATCH
                fi
            fi
            if [[ "$MASTER" != "" ]]; then
                echo "Found existing redis master, updating config"
                sed -i "s/^.*slaveof.*/slaveof $MASTER 6379/" $REDIS_CONF
                sed -i "s/^.*sentinel monitor.*/sentinel monitor {{ .Values.redis.masterGroupName }} $MASTER 6379 {{ .Values.sentinel.quorum }}/" $SENTINEL_CONF
                if [[ "$MASTER" == "$OLD_IP" ]]; then
                   echo "Replacing old master"
                   sed -i "s/$MASTER/$POD_IP/" $REDIS_CONF $SENTINEL_CONF
                fi
            else
                echo "No redis master found! Configuring default master.."
                if [[ "$HOSTNAME" == '{{ template "redis-ha.fullname" . }}-0' ]]; then
                    if [[ grep "sentinel monitor" $SENTINEL_CONF ]]; then
                        sed -i "s/^.*sentinel monitor.*/sentinel monitor {{ .Values.redis.masterGroupName }} $POD_IP 6379 {{ .Values.sentinel.quorum }}/" $SENTINEL_CONF
                    else
                        echo "sentinel monitor {{ .Values.redis.masterGroupName }} {{ template "redis-ha.fullname" . }}-0.{{ template "redis-ha.fullname" . }} 6379 {{ .Values.sentinel.quorum }}" >> $SENTINEL_CONF
                    fi
                else
                    echo "Setting up slave config.."
                    if [[ grep "slaveof" $REDIS_CONF ]]; then
                        sed -i 's/^.*slaveof.*/slaveof {{ template "redis-ha.fullname" . }}-0.{{ template "redis-ha.fullname" . }} 6379/' $REDIS_CONF
                    else
                        echo "slaveof {{ template "redis-ha.fullname" . }}-0.{{ template "redis-ha.fullname" . }} 6379" >> $REDIS_CONF
                    fi
                fi
            fi
            echo $POD_IP > /data/conf/ip
            chown -R {{ .Values.securityContext.runAsUser }}:{{ .Values.securityContext.fsGroup }} /data/
            echo "Ready.."
