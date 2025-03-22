"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowDown,
  ArrowUp,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  History,
  Loader2,
  Plus,
  Send,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenChart } from "@/components/token-chart"

export function WalletDashboard() {
  const [sendAmount, setSendAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSendTokens = () => {
    setIsSending(true)
    // Simulate API call
    setTimeout(() => {
      setIsSending(false)
      setSendAmount("")
      setRecipientAddress("")
    }, 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">Manage your tokens and transactions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Token Balance</CardTitle>
              <CardDescription>Your current balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">1,250</div>
                  <div className="text-sm text-muted-foreground">≈ $1,250 USD</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Tokens</DialogTitle>
                    <DialogDescription>Transfer tokens to another user or external wallet.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient Address</Label>
                      <Input
                        id="recipient"
                        placeholder="0x..."
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <div className="relative">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                        />
                        <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">tokens</div>
                      </div>
                      <div className="text-xs text-muted-foreground">Available: 1,250 tokens</div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendTokens} disabled={isSending || !sendAmount || !recipientAddress}>
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Tokens
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button className="w-full ml-2">
                <Plus className="mr-2 h-4 w-4" />
                Buy
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending Earnings</CardTitle>
              <CardDescription>To be released soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center dark:bg-yellow-900">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
                <div>
                  <div className="text-3xl font-bold">750</div>
                  <div className="text-sm text-muted-foreground">Release in 7 days</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <History className="mr-2 h-4 w-4" />
                View Schedule
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="md:col-span-2 lg:col-span-1"
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common wallet operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <CreditCard className="h-6 w-6 mb-2" />
                  <span>Add Payment Method</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Download className="h-6 w-6 mb-2" />
                  <span>Withdraw to Bank</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Wallet className="h-6 w-6 mb-2" />
                  <span>Connect Wallet</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <History className="h-6 w-6 mb-2" />
                  <span>Transaction History</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Token Activity</CardTitle>
            <CardDescription>Your token balance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <TokenChart />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent token movements</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="incoming">Incoming</TabsTrigger>
                <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <div className="space-y-4">
                  {[
                    {
                      id: "tx1",
                      type: "incoming",
                      title: "Course: Introduction to Web Development",
                      amount: 450,
                      date: "Mar 28, 2023",
                      status: "Completed",
                      from: "SkillSwap Platform",
                    },
                    {
                      id: "tx2",
                      type: "incoming",
                      title: "1-on-1 Session with Emily",
                      amount: 120,
                      date: "Mar 15, 2023",
                      status: "Completed",
                      from: "Emily Chen",
                    },
                    {
                      id: "tx3",
                      type: "outgoing",
                      title: "Advanced React Patterns Course",
                      amount: 200,
                      date: "Mar 12, 2023",
                      status: "Completed",
                      to: "Sarah Chen",
                    },
                    {
                      id: "tx4",
                      type: "incoming",
                      title: "Group Workshop: JavaScript Basics",
                      amount: 350,
                      date: "Mar 10, 2023",
                      status: "Completed",
                      from: "SkillSwap Platform",
                    },
                    {
                      id: "tx5",
                      type: "outgoing",
                      title: "Withdrawal to External Wallet",
                      amount: 500,
                      date: "Mar 05, 2023",
                      status: "Completed",
                      to: "External Wallet (0x7f...3d2e)",
                    },
                  ].map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            transaction.type === "incoming"
                              ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {transaction.type === "incoming" ? (
                            <ArrowDown className="h-5 w-5" />
                          ) : (
                            <ArrowUp className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.date} • {transaction.status}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.type === "incoming" ? `From: ${transaction.from}` : `To: ${transaction.to}`}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-bold ${
                          transaction.type === "incoming"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.type === "incoming" ? "+" : "-"}
                        {transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="incoming">Incoming Transactions</TabsContent>
              <TabsContent value="outgoing">Outgoing Transactions</TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Transactions
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
