Statistics
==========

The Statistics window provides visualizations of bucket and object
counts, capacity, CPU, and memory use, as well as total data under
management.

|image0|

Information is dynamic and refreshed every 30 seconds by default, over a
moving window. For Backlog, Completions, and Failures, this window is 24
hours, after which data expires. For all other statistics, data is
expired after 15 minutes. No configurations to the frequency or
longevity of these statistics are offered at present; however,
Prometheus also retains all statistics for 15 days by default. This
duration is configurable.

Escape this screen by clicking the back arrow or an item in the
navigation pane.


.. |image0| image:: ../Resources/Images/Orbit_Screencaps/Orbit_Statistics.png
   :class: OneHundredPercent

