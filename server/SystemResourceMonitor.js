/** System Resource Monitor
 * @module SystemResourceMonitor
 * @author Justin Carroll (jrc.csus@gmail.com)
 * @since Nov 15, 2019
 * @requires util
 * @requires child_process
 */

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

var exports = module.exports = {};


/**
 * Return the servers available free swap as deployed on the current server.
 * @returns {object} Value of free swap/total swap in MB.
 * 
0:"     11120108 K total memory"
1:"      5595292 K used memory"
2:"      5988020 K active memory"
3:"      3136476 K inactive memory"
4:"      1282232 K free memory"
5:"        62516 K buffer memory"
6:"      4180068 K swap cache"
7:"     11383804 K total swap"
8:"            0 K used swap"
9:"     11383804 K free swap"
10:"     12760740 non-nice user cpu ticks"
11:"         3482 nice user cpu ticks"
12:"      2177920 system cpu ticks"
13:"     68957723 idle cpu ticks"
14:"        11579 IO-wait cpu ticks"
15:"            0 IRQ cpu ticks"
16:"        21781 softirq cpu ticks"
17:"            0 stolen cpu ticks"
18:"      1720136 pages paged in"
19:"      6298816 pages paged out"
20:"            0 pages swapped in"
21:"            0 pages swapped out"
22:"    602597103 interrupts"
23:"   1862094246 CPU context switches"
24:"   1573999538 boot time"
25:"        73557 forks"
 */
exports.get_freeMemory = async function() {
    // Get free swap and RAM and return.
    var resourceData = await exec('vmstat -s');
    //console.log(resourceData.stdout);
    var memObject = {'totalRAM': (parseInt(resourceData.stdout.split('\n')[0].trim().split(" ")[0])/1024/1024).toFixed(2)+" GiB",
                     'usedRAM': (parseInt(resourceData.stdout.split('\n')[1].trim().split(" ")[0])/1024/1024).toFixed(2)+" GiB",
                     'freeRAM': (parseInt(resourceData.stdout.split('\n')[4].trim().split(" ")[0])/1024/1024).toFixed(2)+" GiB",
                     'totalSwap': (parseInt(resourceData.stdout.split('\n')[7].trim().split(" ")[0])/1024/1024).toFixed(2)+" GiB",
                     'usedSwap': (parseInt(resourceData.stdout.split('\n')[8].trim().split(" ")[0])/1024/1024).toFixed(2)+" GiB",
                     'freeSwap': (parseInt(resourceData.stdout.split('\n')[9].trim().split(" ")[0])/1024/1024).toFixed(2)+" GiB"};
    return memObject;
};

/**
 * Return the servers available free space as deployed on the current disk/partition.
 * @returns {object} {free:X, total:Y}
 * @example {drive: "/dev/sda1", size: "190G", used: "8.8G", available: "171G", usedPerc: "5%"}
 */
exports.get_freeDiskSpace = async function() {
    // Get the systems available disk space in MB.
    var diskData = await exec('df -h /');

    var parsedData = diskData.stdout.split("\n")[1].split(/\s+/);
    var diskObject = {'drive': parsedData[0],
                      'size': parsedData[1],
                      'used': parsedData[2],
                      'available': parsedData[3],
                      'usedPerc': parsedData[4]};
    return diskObject;
};


